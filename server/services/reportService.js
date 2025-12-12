import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';
import Goal from '../models/Goal.js';
import AutomationLog from '../models/AutomationLog.js';
import Home from '../models/Home.js';
import Report from '../models/Report.js';
import mongoose from 'mongoose';

// Constants
const CO2_PER_KWH = 0.82; // kg CO2 per kWh (India average)
const TREES_PER_KG_CO2 = 0.06; // Approximate trees needed to absorb 1 kg CO2/year

/**
 * Get date range based on period type
 */
export function getDateRange(periodType, customStart = null, customEnd = null) {
    const now = new Date();
    let start, end;

    switch (periodType) {
        case 'daily':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(start);
            end.setDate(end.getDate() + 1);
            break;
        case 'weekly':
            start = new Date(now);
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = new Date(now);
            break;
        case 'monthly':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now);
            break;
        case 'custom':
            start = new Date(customStart);
            end = new Date(customEnd);
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now);
    }

    return { start, end };
}

/**
 * Calculate device statistics for a period
 */
export async function calculateDeviceStats(homeId, startDate, endDate) {
    const devices = await Device.find({ home: homeId });
    const deviceStats = [];

    for (const device of devices) {
        const logs = await UsageLog.aggregate([
            {
                $match: {
                    device: device._id,
                    timestamp: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPower: { $sum: '$power' },
                    totalCost: { $sum: '$cost' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = logs[0] || { totalPower: 0, totalCost: 0, count: 0 };
        const totalWh = stats.totalPower; // Already in Wh from logs
        const daysInPeriod = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
        const usageHours = stats.count * (5 / 60); // Each log represents ~5 min interval

        deviceStats.push({
            deviceId: device._id,
            deviceName: device.name,
            category: device.category,
            totalWh: Math.round(totalWh),
            totalCost: Math.round(stats.totalCost * 100) / 100,
            usageHours: Math.round(usageHours * 10) / 10,
            efficiencyScore: device.getEfficiencyScore ? device.getEfficiencyScore() : 85,
            avgDailyUsage: Math.round((totalWh / 1000 / daysInPeriod) * 100) / 100
        });
    }

    // Sort by cost descending
    deviceStats.sort((a, b) => b.totalCost - a.totalCost);
    return deviceStats;
}

/**
 * Calculate peak hours analysis
 */
export async function calculatePeakHours(homeId, startDate, endDate) {
    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    const home = await Home.findById(homeId);
    const peakHoursConfig = home?.tariffPlan?.peakHours || [];

    const hourlyData = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: { $hour: '$timestamp' },
                totalPower: { $sum: '$power' },
                totalCost: { $sum: '$cost' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Fill all 24 hours
    const peakHours = [];
    for (let hour = 0; hour < 24; hour++) {
        const hourData = hourlyData.find(h => h._id === hour) || { totalPower: 0, totalCost: 0 };
        const isPeakTariff = peakHoursConfig.some(p => {
            const startHour = parseInt(p.start?.split(':')[0] || '0');
            const endHour = parseInt(p.end?.split(':')[0] || '0');
            return hour >= startHour && hour < endHour;
        });

        peakHours.push({
            hour,
            power: Math.round(hourData.totalPower),
            cost: Math.round(hourData.totalCost * 100) / 100,
            isPeakTariff
        });
    }

    return peakHours;
}

/**
 * Calculate goal progress
 */
export async function calculateGoalProgress(userId, homeId, startDate, endDate) {
    const goals = await Goal.find({
        user: userId,
        home: homeId,
        status: 'active'
    });

    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    const periodUsage = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalPower: { $sum: '$power' },
                totalCost: { $sum: '$cost' }
            }
        }
    ]);

    const usage = periodUsage[0] || { totalPower: 0, totalCost: 0 };
    const usedKWh = usage.totalPower / 1000;
    const usedCost = usage.totalCost;

    // Find relevant goal
    const usageGoal = goals.find(g => g.type === 'usage');
    const costGoal = goals.find(g => g.type === 'cost');

    const targetKWh = usageGoal?.target?.value || 300; // Default 300 kWh
    const targetCost = costGoal?.target?.value || 2000; // Default ₹2000

    const percentage = Math.min(100, (usedKWh / targetKWh) * 100);
    let status = 'on_track';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'at_risk';

    return {
        targetKWh: Math.round(targetKWh),
        usedKWh: Math.round(usedKWh * 100) / 100,
        targetCost: Math.round(targetCost),
        usedCost: Math.round(usedCost * 100) / 100,
        percentage: Math.round(percentage),
        status
    };
}

/**
 * Calculate automation impact
 */
export async function calculateAutomationImpact(homeId, startDate, endDate) {
    const logs = await AutomationLog.find({
        home: homeId,
        timestamp: { $gte: startDate, $lt: endDate },
        executed: true
    }).populate('rule');

    const rulesTriggered = logs.length;
    const estimatedSavings = logs.reduce((sum, log) => sum + (log.estimatedImpact?.savings || 0), 0);
    const actualSavings = logs.reduce((sum, log) => sum + (log.actualImpact?.savings || 0), 0);

    // Group by rule
    const ruleMap = new Map();
    for (const log of logs) {
        const ruleId = log.rule?._id?.toString() || 'unknown';
        if (!ruleMap.has(ruleId)) {
            ruleMap.set(ruleId, {
                ruleId: log.rule?._id,
                ruleName: log.rule?.name || 'Auto Rule',
                savings: 0,
                timesTriggered: 0
            });
        }
        const entry = ruleMap.get(ruleId);
        entry.savings += log.actualImpact?.savings || log.estimatedImpact?.savings || 0;
        entry.timesTriggered++;
    }

    const topRules = Array.from(ruleMap.values())
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 5);

    return {
        rulesTriggered,
        estimatedSavings: Math.round(estimatedSavings * 100) / 100,
        actualSavings: Math.round(actualSavings * 100) / 100,
        topRules
    };
}

/**
 * Calculate cost breakdown
 */
export async function calculateCostBreakdown(homeId, startDate, endDate) {
    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    // By device
    const byDeviceAgg = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: '$device',
                totalCost: { $sum: '$cost' }
            }
        },
        { $sort: { totalCost: -1 } }
    ]);

    const totalCost = byDeviceAgg.reduce((sum, d) => sum + d.totalCost, 0) || 1;

    const byDevice = byDeviceAgg.map(d => {
        const device = devices.find(dev => dev._id.toString() === d._id.toString());
        return {
            deviceId: d._id,
            deviceName: device?.name || 'Unknown',
            cost: Math.round(d.totalCost * 100) / 100,
            percentage: Math.round((d.totalCost / totalCost) * 100)
        };
    });

    // By category
    const categoryMap = new Map();
    for (const d of byDevice) {
        const device = devices.find(dev => dev._id.toString() === d.deviceId.toString());
        const category = device?.category || 'Other';
        if (!categoryMap.has(category)) {
            categoryMap.set(category, 0);
        }
        categoryMap.set(category, categoryMap.get(category) + d.cost);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, cost]) => ({
        category,
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round((cost / totalCost) * 100)
    })).sort((a, b) => b.cost - a.cost);

    // By time of day
    const timeOfDayAgg = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $project: {
                cost: 1,
                hour: { $hour: '$timestamp' }
            }
        },
        {
            $project: {
                cost: 1,
                period: {
                    $switch: {
                        branches: [
                            { case: { $and: [{ $gte: ['$hour', 6] }, { $lt: ['$hour', 12] }] }, then: 'morning' },
                            { case: { $and: [{ $gte: ['$hour', 12] }, { $lt: ['$hour', 17] }] }, then: 'afternoon' },
                            { case: { $and: [{ $gte: ['$hour', 17] }, { $lt: ['$hour', 21] }] }, then: 'evening' }
                        ],
                        default: 'night'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$period',
                totalCost: { $sum: '$cost' }
            }
        }
    ]);

    const byTimeOfDay = ['morning', 'afternoon', 'evening', 'night'].map(period => {
        const data = timeOfDayAgg.find(t => t._id === period) || { totalCost: 0 };
        return {
            period,
            cost: Math.round(data.totalCost * 100) / 100,
            percentage: Math.round((data.totalCost / totalCost) * 100)
        };
    });

    return { byDevice, byCategory, byTimeOfDay };
}

/**
 * Calculate predictive forecast
 */
export async function calculateForecast(homeId, startDate, endDate) {
    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    const now = new Date();
    const daysPassed = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const currentUsage = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalPower: { $sum: '$power' },
                totalCost: { $sum: '$cost' }
            }
        }
    ]);

    const usage = currentUsage[0] || { totalPower: 0, totalCost: 0 };

    // Project to end of month
    const dailyAvgCost = usage.totalCost / daysPassed;
    const dailyAvgUsage = usage.totalPower / 1000 / daysPassed;

    const projectedCost = dailyAvgCost * daysInMonth;
    const projectedUsage = dailyAvgUsage * daysInMonth;

    // Determine trend (compare first half to second half of period)
    const midDate = new Date((startDate.getTime() + now.getTime()) / 2);

    const firstHalf = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: startDate, $lt: midDate }
            }
        },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);

    const secondHalf = await UsageLog.aggregate([
        {
            $match: {
                device: { $in: deviceIds },
                timestamp: { $gte: midDate, $lt: now }
            }
        },
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);

    const firstHalfCost = firstHalf[0]?.totalCost || 0;
    const secondHalfCost = secondHalf[0]?.totalCost || 0;

    let trend = 'stable';
    if (secondHalfCost > firstHalfCost * 1.1) trend = 'increasing';
    else if (secondHalfCost < firstHalfCost * 0.9) trend = 'decreasing';

    // Confidence based on data completeness
    const confidence = Math.min(95, Math.round((daysPassed / daysInMonth) * 100));

    return {
        projectedCost: Math.round(projectedCost * 100) / 100,
        projectedUsage: Math.round(projectedUsage * 100) / 100,
        confidence,
        trend,
        projectedSavings: trend === 'decreasing' ? Math.round((projectedCost * 0.1) * 100) / 100 : 0
    };
}

/**
 * Calculate carbon impact
 */
export function calculateCarbonImpact(totalKWh) {
    const kgCO2 = totalKWh * CO2_PER_KWH;
    const treesEquivalent = kgCO2 * TREES_PER_KG_CO2;

    // Average household in India uses ~100 kWh/month
    const avgHouseholdKWh = 100;
    const comparedToAverage = ((totalKWh - avgHouseholdKWh) / avgHouseholdKWh) * 100;

    return {
        kgCO2: Math.round(kgCO2 * 100) / 100,
        treesEquivalent: Math.round(treesEquivalent * 10) / 10,
        comparedToAverage: Math.round(comparedToAverage)
    };
}

/**
 * Generate recommendations based on report data
 */
export function generateRecommendations(deviceStats, peakHours, goalStatus, automationImpact) {
    const recommendations = [];

    // Device-based recommendations
    if (deviceStats.length > 0) {
        const topDevice = deviceStats[0];
        if (topDevice.totalCost > 500) {
            recommendations.push({
                category: 'device',
                title: `Reduce ${topDevice.deviceName} Usage`,
                description: `${topDevice.deviceName} is your most expensive device (₹${topDevice.totalCost}). Consider reducing usage during peak hours.`,
                potentialSavings: Math.round(topDevice.totalCost * 0.15),
                priority: 'high'
            });
        }

        const lowEfficiency = deviceStats.filter(d => d.efficiencyScore < 70);
        for (const device of lowEfficiency.slice(0, 2)) {
            recommendations.push({
                category: 'upgrade',
                title: `Upgrade ${device.deviceName}`,
                description: `${device.deviceName} has low efficiency (${device.efficiencyScore}%). Consider upgrading to an energy-efficient model.`,
                potentialSavings: Math.round(device.totalCost * 0.25),
                priority: 'medium'
            });
        }
    }

    // Peak hours recommendations
    const peakCost = peakHours.filter(h => h.isPeakTariff).reduce((sum, h) => sum + h.cost, 0);
    const totalHourlyCost = peakHours.reduce((sum, h) => sum + h.cost, 0);
    if (peakCost > totalHourlyCost * 0.4) {
        recommendations.push({
            category: 'behavior',
            title: 'Shift Usage to Off-Peak Hours',
            description: `${Math.round((peakCost / totalHourlyCost) * 100)}% of your costs occur during peak tariff hours. Shift heavy usage to off-peak times.`,
            potentialSavings: Math.round(peakCost * 0.2),
            priority: 'high'
        });
    }

    // Goal-based recommendations
    if (goalStatus.status === 'at_risk' || goalStatus.status === 'exceeded') {
        recommendations.push({
            category: 'behavior',
            title: 'Review Usage Patterns',
            description: `You're at ${goalStatus.percentage}% of your energy goal. Review your daily usage to stay on track.`,
            potentialSavings: Math.round(goalStatus.usedCost * 0.1),
            priority: goalStatus.status === 'exceeded' ? 'high' : 'medium'
        });
    }

    // Automation recommendations
    if (automationImpact.rulesTriggered < 5) {
        recommendations.push({
            category: 'automation',
            title: 'Set Up More Automation Rules',
            description: 'You have few active automation rules. Setting up schedules can save you up to 20% on energy costs.',
            potentialSavings: Math.round(goalStatus.usedCost * 0.2),
            priority: 'medium'
        });
    }

    return recommendations;
}

/**
 * Generate complete report summary
 */
export async function generateReportSummary(userId, homeId, periodType, customStart = null, customEnd = null) {
    const { start, end } = getDateRange(periodType, customStart, customEnd);

    const [deviceStats, peakHours, goalStatus, automationImpact, costBreakdown, forecast] = await Promise.all([
        calculateDeviceStats(homeId, start, end),
        calculatePeakHours(homeId, start, end),
        calculateGoalProgress(userId, homeId, start, end),
        calculateAutomationImpact(homeId, start, end),
        calculateCostBreakdown(homeId, start, end),
        calculateForecast(homeId, start, end)
    ]);

    const totalEnergy = deviceStats.reduce((sum, d) => sum + d.totalWh, 0) / 1000;
    const totalCost = deviceStats.reduce((sum, d) => sum + d.totalCost, 0);
    const daysInPeriod = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));

    const carbonImpact = calculateCarbonImpact(totalEnergy);
    const recommendations = generateRecommendations(deviceStats, peakHours, goalStatus, automationImpact);

    // Find peak usage time
    const sortedPeakHours = [...peakHours].sort((a, b) => b.power - a.power);
    const peakHour = sortedPeakHours[0]?.hour || 18;
    const peakUsageTime = `${peakHour}:00-${peakHour + 1}:00`;

    const summary = {
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        avgDailyCost: Math.round((totalCost / daysInPeriod) * 100) / 100,
        avgDailyUsage: Math.round((totalEnergy / daysInPeriod) * 100) / 100,
        peakUsageTime,
        mostExpensiveDevice: deviceStats[0]?.deviceName || 'N/A',
        savingsVsPrevious: automationImpact.actualSavings || 0,
        savingsPercentage: totalCost > 0 ? Math.round((automationImpact.actualSavings / totalCost) * 100) : 0
    };

    return {
        dateRange: { type: periodType, start, end },
        deviceStats,
        peakHours,
        goalStatus,
        automationImpact,
        costBreakdown,
        forecast,
        carbonImpact,
        summary,
        recommendations,
        alerts: [] // Could be populated with real-time alerts
    };
}
