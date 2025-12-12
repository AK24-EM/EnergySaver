import express from 'express';
import Device from '../models/Device.js';
import UsageLog from '../models/UsageLog.js';
import Goal from '../models/Goal.js';
import comparisonService from '../services/comparisonService.js';
import { calculateDeviceStats } from '../services/reportService.js';

const router = express.Router();

// Get usage trends and comparisons
router.get('/trends', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const userDevices = await Device.find({ home: req.user.home._id }).select('_id');
        const deviceIds = userDevices.map(d => d._id);

        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Today's usage
        const todayUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: today } } },
            { $group: { _id: null, totalPower: { $sum: '$power' }, totalCost: { $sum: '$cost' } } }
        ]);

        // Yesterday's usage
        const yesterdayUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: yesterday, $lt: today } } },
            { $group: { _id: null, totalPower: { $sum: '$power' }, totalCost: { $sum: '$cost' } } }
        ]);

        // This week's usage
        const thisWeekUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: thisWeekStart } } },
            { $group: { _id: null, totalPower: { $sum: '$power' }, totalCost: { $sum: '$cost' } } }
        ]);

        // Last week's usage
        const lastWeekUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: lastWeekStart, $lt: thisWeekStart } } },
            { $group: { _id: null, totalPower: { $sum: '$power' }, totalCost: { $sum: '$cost' } } }
        ]);

        // Top consuming devices (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const topConsumers = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: '$device',
                    totalPower: { $sum: '$power' },
                    totalCost: { $sum: '$cost' },
                    avgPower: { $avg: '$power' }
                }
            },
            {
                $lookup: {
                    from: 'devices',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'deviceInfo'
                }
            },
            { $unwind: '$deviceInfo' },
            {
                $project: {
                    deviceId: '$_id',
                    name: '$deviceInfo.name',
                    category: '$deviceInfo.category',
                    totalPower: 1,
                    totalCost: 1,
                    avgPower: 1
                }
            },
            { $sort: { totalCost: -1 } },
            { $limit: 5 }
        ]);

        // Calculate total for percentage
        const totalConsumption = topConsumers.reduce((sum, d) => sum + d.totalCost, 0);
        const topConsumersWithPercent = topConsumers.map(device => ({
            ...device,
            percentage: totalConsumption > 0 ? ((device.totalCost / totalConsumption) * 100).toFixed(1) : 0
        }));

        // Calculate wasteful devices using report logic + comparison logic
        // We reuse reportService to get detailed stats for the week
        const deviceStats = await calculateDeviceStats(req.user.home._id, sevenDaysAgo, new Date());

        const wastefulDevices = deviceStats.filter(d => {
            // 1. Inefficient devices (if we have efficiency score)
            if (d.efficiencyScore && d.efficiencyScore < 70) return true;

            // 2. High cost relative to others (e.g. > 30% of total tracked cost)
            const totalPeriodCost = deviceStats.reduce((sum, item) => sum + item.totalCost, 0);
            const costShare = totalPeriodCost > 0 ? (d.totalCost / totalPeriodCost) : 0;

            // 3. Specific categories that are often wasteful if high usage
            const isHighLoadCategory = ['Cooling', 'Heating', 'Water Heater'].includes(d.category);

            return (costShare > 0.3 && isHighLoadCategory) || (costShare > 0.5); // Very high consumer
        }).map(d => ({
            deviceId: d.deviceId,
            name: d.deviceName,
            category: d.category,
            percentage: Math.round((d.totalCost / (deviceStats.reduce((s, i) => s + i.totalCost, 0) || 1)) * 100)
        }));


        // Fetch Comparison Intelligence
        let benchmarkingData = null;
        try {
            const comparisonData = await comparisonService.getComparisonData(req.user.home._id);
            if (comparisonData) {
                benchmarkingData = {
                    carbonFootprint: {
                        user: comparisonData.userMetrics.carbonKg,
                        neighborhood: comparisonData.benchmarkMetrics.avgCarbonKg,
                        status: comparisonData.userMetrics.carbonKg < comparisonData.benchmarkMetrics.avgCarbonKg ? 'better' : 'worse'
                    },
                    efficiencyScore: comparisonData.efficiencyRank
                };
            }
        } catch (err) {
            console.warn("Benchmarking data fetch failed, using fallback", err.message);
            // Fallback if service fails (though service has its own fallback)
            benchmarkingData = {
                carbonFootprint: { user: 0, neighborhood: 0, status: 'unknown' },
                efficiencyScore: 50
            };
        }

        res.json({
            comparisons: {
                today: todayUsage[0] || { totalPower: 0, totalCost: 0 },
                yesterday: yesterdayUsage[0] || { totalPower: 0, totalCost: 0 },
                thisWeek: thisWeekUsage[0] || { totalPower: 0, totalCost: 0 },
                lastWeek: lastWeekUsage[0] || { totalPower: 0, totalCost: 0 }
            },
            topConsumers: topConsumersWithPercent,
            wastefulDevices: wastefulDevices.slice(0, 3), // Top 3
            benchmarking: benchmarkingData
        });
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get/Create user goals
router.get('/goals', async (req, res) => {
    try {
        const homeId = req.user.home._id;

        // 1. Try to fetch existing Goal documents
        const goals = await Goal.find({ home: homeId, status: 'active' });

        const costGoal = goals.find(g => g.type === 'cost' && g.period === 'monthly');
        const usageGoal = goals.find(g => g.type === 'usage' && g.period === 'daily'); // Assuming daily check is common

        // 2. Fallbacks from Home Settings if no Goals found
        const dailyBudgetTarget = usageGoal ? usageGoal.target.value : (req.user.home?.settings?.budget?.daily || 100);
        const monthlyBudgetTarget = costGoal ? costGoal.target.value : (req.user.home?.settings?.budget?.monthly || 3000);

        // 3. Calculate Current Progress (Real-time)
        const userDevices = await Device.find({ home: homeId }).select('_id');
        const deviceIds = userDevices.map(d => d._id);

        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayProgress = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: todayStart } } },
            { $group: { _id: null, totalCost: { $sum: '$cost' } } }
        ]);

        const monthProgress = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: monthStart } } },
            { $group: { _id: null, totalCost: { $sum: '$cost' } } }
        ]);

        const todayCost = todayProgress[0]?.totalCost || 0;
        const monthCost = monthProgress[0]?.totalCost || 0;

        // 4. Construct Response
        res.json({
            daily: {
                target: dailyBudgetTarget,
                current: todayCost,
                percentage: dailyBudgetTarget > 0 ? (todayCost / dailyBudgetTarget) * 100 : 0,
                status: todayCost <= dailyBudgetTarget ? 'on-track' : 'exceeded'
            },
            monthly: {
                target: monthlyBudgetTarget,
                current: monthCost,
                percentage: monthlyBudgetTarget > 0 ? (monthCost / monthlyBudgetTarget) * 100 : 0,
                status: monthCost <= monthlyBudgetTarget ? 'on-track' : 'at-risk'
            }
        });
    } catch (error) {
        console.error('Goals error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get baseline analysis for home devices
router.get('/baseline', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const baselineService = (await import('../services/baselineService.js')).default;
        const baselines = await baselineService.getHomeBaselines(req.user.home._id, 30);

        res.json({ baselines });
    } catch (error) {
        console.error('Baseline error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get savings analysis
router.get('/savings', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const { period = '7d' } = req.query;
        const savingsService = (await import('../services/savingsService.js')).default;
        const savings = await savingsService.calculateSavings(req.user.home._id, period);
        const breakdown = await savingsService.getSavingsBreakdown(req.user.home._id, period);

        res.json({ ...savings, breakdown });
    } catch (error) {
        console.error('Savings error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get peak load predictions
router.get('/peak-forecast', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const peakService = (await import('../services/peakPredictionService.js')).default;
        const predictions = await peakService.predictPeaks(req.user.home._id);

        // Also check budget forecast
        const dailyBudget = req.user.home?.settings?.budget?.daily || 100;
        const budgetForecast = await peakService.forecastBudgetExceedance(req.user.home._id, dailyBudget);

        res.json({ ...predictions, budgetForecast });
    } catch (error) {
        console.error('Peak forecast error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get device health analysis
router.get('/device-health', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const healthService = (await import('../services/deviceHealthService.js')).default;
        const health = await healthService.getHomeDevicesHealth(req.user.home._id);

        res.json(health);
    } catch (error) {
        console.error('Device health error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get device health for specific device
router.get('/device-health/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const healthService = (await import('../services/deviceHealthService.js')).default;
        const health = await healthService.calculateDeviceHealth(deviceId, 30);

        res.json(health);
    } catch (error) {
        console.error('Device health error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get anomalies (recent unusual consumption)
router.get('/anomalies', async (req, res) => {
    try {
        if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

        const baselineService = (await import('../services/baselineService.js')).default;
        const Device = (await import('../models/Device.js')).default;
        const UsageLog = (await import('../models/UsageLog.js')).default;

        const devices = await Device.find({ home: req.user.home._id });
        const anomalies = [];

        // Check last 24 hours for anomalies
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const device of devices) {
            const baseline = await baselineService.calculateBaseline(device._id, 30);
            if (baseline.overall) {
                const recentLogs = await UsageLog.find({
                    device: device._id,
                    timestamp: { $gte: yesterday }
                }).sort({ timestamp: -1 }).limit(10);

                for (const log of recentLogs) {
                    const anomaly = baselineService.detectAnomaly(log.power, baseline, 2);
                    if (anomaly.isAnomaly) {
                        anomalies.push({
                            device: { id: device._id, name: device.name, category: device.category },
                            timestamp: log.timestamp,
                            power: log.power,
                            ...anomaly
                        });
                    }
                }
            }
        }

        res.json({ anomalies: anomalies.slice(0, 10) }); // Top 10 most recent
    } catch (error) {
        console.error('Anomalies error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
