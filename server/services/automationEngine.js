import AutomationRule from '../models/AutomationRule.js';
import AutomationLog from '../models/AutomationLog.js';
import Device from '../models/Device.js';
import logger from '../utils/logger.js';

/**
 * Automation Engine - Rule evaluation and execution with safety checks
 */
class AutomationEngine {
    constructor() {
        this.activeOverrides = new Map(); // deviceId -> expiryTime
    }

    /**
     * Evaluate all active rules for a home
     */
    async evaluateRules(homeId, io) {
        try {
            const rules = await AutomationRule.find({
                home: homeId,
                enabled: true
            }).populate('action.devices action.exceptions');

            const results = [];

            for (const rule of rules) {
                if (await this.shouldTrigger(rule)) {
                    const canExecute = await this.canExecuteRule(rule);

                    if (canExecute.allowed) {
                        const result = await this.executeRule(rule, io);
                        results.push(result);
                    } else {
                        await this.logSkipped(rule, canExecute.reason);
                    }
                }
            }

            return results;
        } catch (error) {
            logger.error('Rule evaluation error:', error);
            return [];
        }
    }

    /**
     * Check if rule should trigger
     */
    async shouldTrigger(rule) {
        const now = new Date();

        if (rule.trigger.type === 'time' && rule.trigger.schedule) {
            const { hour, minute, days } = rule.trigger.schedule;
            const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

            if (days && !days.includes(currentDay)) return false;

            return now.getHours() === hour && now.getMinutes() === minute;
        }

        // Condition and event triggers handled elsewhere
        return false;
    }

    /**
     * Safety checks before execution
     */
    async canExecuteRule(rule) {
        const checks = [];

        // Check 1: Essential device protection
        const essentialCheck = await this.checkEssentialDevices(rule);
        checks.push(essentialCheck);
        if (!essentialCheck.passed) {
            return { allowed: false, reason: essentialCheck.reason, checks };
        }

        // Check 2: Recent manual control
        const manualCheck = await this.checkUserOverride(rule);
        checks.push(manualCheck);
        if (!manualCheck.passed) {
            return { allowed: false, reason: manualCheck.reason, checks };
        }

        // Check 3: Minimum savings threshold
        const savingsCheck = await this.checkMinimumSavings(rule);
        checks.push(savingsCheck);
        if (!savingsCheck.passed) {
            return { allowed: false, reason: savingsCheck.reason, checks };
        }

        // Check 4: Automation fatigue (max 3 actions per hour)
        const fatigueCheck = await this.checkAutomationFatigue(rule);
        checks.push(fatigueCheck);
        if (!fatigueCheck.passed) {
            return { allowed: false, reason: fatigueCheck.reason, checks };
        }

        return { allowed: true, checks };
    }

    async checkEssentialDevices(rule) {
        const devices = await Device.find({ _id: { $in: rule.action.devices } });
        const essential = devices.filter(d => d.priority >= 9);

        if (essential.length > 0) {
            return {
                check: 'essential_devices',
                passed: false,
                reason: `Cannot automate essential devices: ${essential.map(d => d.name).join(', ')}`
            };
        }

        return { check: 'essential_devices', passed: true };
    }

    async checkUserOverride(rule) {
        const devices = await Device.find({ _id: { $in: rule.action.devices } });
        const recentlyControlled = devices.filter(d => {
            const lastControl = d.lastManualControl || new Date(0);
            return (Date.now() - lastControl.getTime()) < 30 * 60 * 1000; // 30 minutes
        });

        if (recentlyControlled.length > 0) {
            return {
                check: 'user_override',
                passed: false,
                reason: `Devices recently controlled manually: ${recentlyControlled.map(d => d.name).join(', ')}`
            };
        }

        return { check: 'user_override', passed: true };
    }

    async checkMinimumSavings(rule) {
        // Simple estimation: assume 100W per device, 1 hour duration, ₹5.5/kWh
        const estimatedSavings = rule.action.devices.length * 0.1 * 5.5;
        const minSavings = rule.constraints?.minSavings || 5;

        if (estimatedSavings < minSavings) {
            return {
                check: 'minimum_savings',
                passed: false,
                reason: `Estimated savings ₹${estimatedSavings.toFixed(2)} below threshold ₹${minSavings}`
            };
        }

        return { check: 'minimum_savings', passed: true };
    }

    async checkAutomationFatigue(rule) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentActions = await AutomationLog.countDocuments({
            home: rule.home,
            executed: true,
            timestamp: { $gte: oneHourAgo }
        });

        if (recentActions >= 3) {
            return {
                check: 'automation_fatigue',
                passed: false,
                reason: `Too many automated actions (${recentActions}) in last hour`
            };
        }

        return { check: 'automation_fatigue', passed: true };
    }

    /**
     * Execute automation rule
     */
    async executeRule(rule, io) {
        try {
            const devices = await Device.find({ _id: { $in: rule.action.devices } });
            const affectedDevices = [];

            for (const device of devices) {
                if (rule.action.type === 'turn_off') {
                    device.isActive = false;
                    device.currentPower = 0;
                    device.status = 'off';
                } else if (rule.action.type === 'turn_on') {
                    device.isActive = true;
                    device.status = 'on';
                } else if (rule.action.type === 'set_mode') {
                    device.mode = rule.action.parameters?.mode || 'eco';
                }

                await device.save();
                affectedDevices.push(device._id);

                // Emit real-time update
                if (io) {
                    io.to(rule.home.toString()).emit('device-update', {
                        deviceId: device._id,
                        isActive: device.isActive,
                        currentPower: device.currentPower,
                        status: device.status
                    });
                }
            }

            // Update rule metadata
            rule.metadata.lastTriggered = new Date();
            rule.metadata.triggerCount += 1;
            await rule.save();

            // Log execution
            const log = await AutomationLog.create({
                rule: rule._id,
                home: rule.home,
                action: {
                    type: rule.action.type,
                    devices: affectedDevices,
                    parameters: rule.action.parameters
                },
                trigger: {
                    triggerType: rule.trigger.type,
                    value: rule.trigger.schedule || rule.trigger.condition
                },
                reasoning: `Rule "${rule.name}" triggered`,
                executed: true,
                estimatedImpact: {
                    savings: devices.length * 0.1 * 5.5,
                    affectedDevices: devices.length
                }
            });

            logger.info(`Automation executed: ${rule.name} (${devices.length} devices)`);

            return {
                success: true,
                rule: rule.name,
                devices: devices.map(d => d.name),
                logId: log._id
            };
        } catch (error) {
            logger.error('Rule execution error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Log skipped rule
     */
    async logSkipped(rule, reason) {
        await AutomationLog.create({
            rule: rule._id,
            home: rule.home,
            action: {
                type: rule.action.type,
                devices: rule.action.devices
            },
            trigger: {
                triggerType: rule.trigger.type
            },
            executed: false,
            skipReason: reason
        });
    }

    /**
     * Undo automation action
     */
    async undoAction(logId, io) {
        try {
            const log = await AutomationLog.findById(logId).populate('action.devices');
            if (!log || !log.executed) {
                return { success: false, error: 'Action not found or not executed' };
            }

            // Revert device states (simple toggle for now)
            const devices = await Device.find({ _id: { $in: log.action.devices } });

            for (const device of devices) {
                if (log.action.type === 'turn_off') {
                    device.isActive = true;
                    device.status = 'on';
                } else if (log.action.type === 'turn_on') {
                    device.isActive = false;
                    device.status = 'off';
                }
                await device.save();

                if (io) {
                    io.to(log.home.toString()).emit('device-update', {
                        deviceId: device._id,
                        isActive: device.isActive,
                        status: device.status
                    });
                }
            }

            // Update log
            log.userResponse = {
                type: 'undone',
                timestamp: new Date(),
                responseTime: Date.now() - log.timestamp.getTime()
            };
            await log.save();

            // Update rule undo count
            if (log.rule) {
                const rule = await AutomationRule.findById(log.rule);
                if (rule) {
                    rule.metadata.undoCount += 1;
                    await rule.save();
                }
            }

            return { success: true, message: 'Action undone successfully' };
        } catch (error) {
            logger.error('Undo error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new AutomationEngine();
