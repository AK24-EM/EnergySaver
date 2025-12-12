import express from 'express';
import AutomationRule from '../models/AutomationRule.js';
import AutomationLog from '../models/AutomationLog.js';
import Device from '../models/Device.js';
import automationEngine from '../services/automationEngine.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Get all automation rules for user's home
router.get('/rules', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const rules = await AutomationRule.find({ home: req.user.home._id })
            .populate('action.devices action.exceptions')
            .sort({ priority: -1, createdAt: -1 });

        res.json({ rules });
    } catch (error) {
        console.error('Get rules error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new automation rule
router.post('/rules', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const rule = await AutomationRule.create({
            ...req.body,
            user: req.user._id,
            home: req.user.home._id
        });

        res.status(201).json({ rule });
    } catch (error) {
        console.error('Create rule error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update automation rule
router.put('/rules/:id', async (req, res) => {
    try {
        const rule = await AutomationRule.findOneAndUpdate(
            { _id: req.params.id, home: req.user.home._id },
            req.body,
            { new: true }
        );

        if (!rule) return res.status(404).json({ error: 'Rule not found' });

        res.json({ rule });
    } catch (error) {
        console.error('Update rule error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete automation rule
router.delete('/rules/:id', async (req, res) => {
    try {
        const rule = await AutomationRule.findOneAndDelete({
            _id: req.params.id,
            home: req.user.home._id
        });

        if (!rule) return res.status(404).json({ error: 'Rule not found' });

        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Delete rule error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get automation modes (Away, Sleep, Eco)
router.get('/modes', async (req, res) => {
    try {
        const modes = [
            {
                id: 'away',
                name: 'Away Mode',
                icon: '🏠',
                description: 'Minimize consumption while you\'re out',
                estimatedSavings: '₹50-80/day',
                actions: ['Turn off non-essential devices', 'Set refrigerator to eco mode']
            },
            {
                id: 'sleep',
                name: 'Sleep Mode',
                icon: '🌙',
                description: 'Optimize for comfort and savings overnight',
                estimatedSavings: '₹30-50/night',
                actions: ['Gradually reduce AC temperature', 'Turn off lights after 15 min']
            },
            {
                id: 'eco',
                name: 'Eco Mode',
                icon: '🌱',
                description: 'Maximum savings without sacrificing essentials',
                estimatedSavings: '15-25% reduction',
                actions: ['Set all devices to eco mode', 'Turn off standby devices']
            }
        ];

        res.json({ modes });
    } catch (error) {
        console.error('Get modes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Activate automation mode
router.post('/modes/:mode', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const { mode } = req.params;
        const homeId = req.user.home._id || req.user.home;
        const devices = await Device.find({ home: homeId });
        const affectedDevices = [];

        if (mode === 'away') {
            // Turn off non-essential devices (keep Refrigerator, Security)
            const essentialCategories = ['Refrigerator', 'Security', 'Medical'];
            for (const device of devices) {
                if (!essentialCategories.includes(device.category) && device.isActive) {
                    device.isActive = false;
                    device.currentPower = 0;
                    device.status = 'off';
                    await device.save();
                    affectedDevices.push(device.name);
                }
            }
        } else if (mode === 'sleep') {
            // Turn off lights and entertainment
            for (const device of devices) {
                if (['Light', 'TV', 'Entertainment'].includes(device.category) && device.isActive) {
                    device.isActive = false;
                    device.currentPower = 0;
                    device.status = 'off';
                    await device.save();
                    affectedDevices.push(device.name);
                }
            }
        } else if (mode === 'eco') {
            // Set all devices to eco mode
            for (const device of devices) {
                if (device.isActive) {
                    device.mode = 'eco';
                    device.currentPower = Math.round(device.currentPower * 0.8); // 20% reduction
                    await device.save();
                    affectedDevices.push(device.name);
                }
            }
        }

        // Log the mode activation
        await AutomationLog.create({
            home: req.user.home._id || req.user.home,
            action: {
                type: `${mode}_mode`,
                devices: devices.filter(d => affectedDevices.includes(d.name)).map(d => d._id)
            },
            trigger: {
                triggerType: 'manual',
                value: `User activated ${mode} mode`
            },
            reasoning: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated by user`,
            executed: true,
            estimatedImpact: {
                affectedDevices: affectedDevices.length
            }
        });

        // Log Activity
        await logActivity(
            req.user.home._id,
            req.user._id,
            'MODE_ACTIVATE',
            `Activated ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
            { mode, affectedDevices: affectedDevices.length }
        );

        res.json({
            success: true,
            mode,
            affectedDevices,
            message: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated`
        });
    } catch (error) {
        console.error('Activate mode error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Pause automation
router.post('/pause', async (req, res) => {
    try {
        const { duration } = req.body; // minutes

        // For MVP, just disable all rules temporarily
        // In production, this would set a pause flag with expiry

        res.json({
            success: true,
            message: `Automation paused for ${duration} minutes`,
            expiresAt: new Date(Date.now() + duration * 60 * 1000)
        });
    } catch (error) {
        console.error('Pause automation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Undo automation action
router.post('/undo/:actionId', async (req, res) => {
    try {
        const result = await automationEngine.undoAction(req.params.actionId, req.app.get('io'));

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Undo action error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get automation logs (action history)
router.get('/logs', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const { limit = 50, executed } = req.query;

        const query = { home: req.user.home._id };
        if (executed !== undefined) {
            query.executed = executed === 'true';
        }

        const logs = await AutomationLog.find(query)
            .populate('rule action.devices')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json({ logs });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get automation status
router.get('/status', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const activeRules = await AutomationRule.countDocuments({
            home: req.user.home._id,
            enabled: true
        });

        const recentActions = await AutomationLog.countDocuments({
            home: req.user.home._id,
            executed: true,
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const undoneActions = await AutomationLog.countDocuments({
            home: req.user.home._id,
            'userResponse.type': 'undone',
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        res.json({
            activeRules,
            recentActions,
            undoneActions,
            automationEnabled: activeRules > 0
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
