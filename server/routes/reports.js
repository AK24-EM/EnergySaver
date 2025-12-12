import express from 'express';
import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';
import Goal from '../models/Goal.js';
import Report from '../models/Report.js';
import * as reportService from '../services/reportService.js';

const router = express.Router();

// Helper to safely get homeId whether populated or not
const getHomeId = (user) => {
  if (!user.home) return null;
  // If home is populated (object), get _id; otherwise it's already an ObjectId
  return user.home._id || user.home;
};

// Get complete report summary (main dashboard endpoint)
router.get('/summary', async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    if (!homeId) {
      return res.status(400).json({ error: 'No home associated with user' });
    }

    const report = await reportService.generateReportSummary(
      userId,
      homeId,
      period,
      startDate,
      endDate
    );

    res.json(report);
  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily report
router.get('/daily', async (req, res) => {
  try {
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    const { start, end } = reportService.getDateRange('daily');

    const [deviceStats, peakHours, costBreakdown] = await Promise.all([
      reportService.calculateDeviceStats(homeId, start, end),
      reportService.calculatePeakHours(homeId, start, end),
      reportService.calculateCostBreakdown(homeId, start, end)
    ]);

    const totalEnergy = deviceStats.reduce((sum, d) => sum + d.totalWh, 0) / 1000;
    const totalCost = deviceStats.reduce((sum, d) => sum + d.totalCost, 0);

    res.json({
      period: 'daily',
      date: start.toISOString().split('T')[0],
      deviceStats,
      peakHours,
      costBreakdown,
      summary: {
        totalEnergy: Math.round(totalEnergy * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get weekly report
router.get('/weekly', async (req, res) => {
  try {
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    const report = await reportService.generateReportSummary(userId, homeId, 'weekly');

    // Add comparison with previous week
    const prevStart = new Date(report.dateRange.start);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(report.dateRange.start);

    const prevWeekStats = await reportService.calculateDeviceStats(homeId, prevStart, prevEnd);
    const prevWeekCost = prevWeekStats.reduce((sum, d) => sum + d.totalCost, 0);

    const savings = prevWeekCost - report.summary.totalCost;
    const savingsPercentage = prevWeekCost > 0 ? (savings / prevWeekCost) * 100 : 0;

    res.json({
      ...report,
      comparison: {
        previousPeriodCost: Math.round(prevWeekCost * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        savingsPercentage: Math.round(savingsPercentage)
      }
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get monthly report
router.get('/monthly', async (req, res) => {
  try {
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    const report = await reportService.generateReportSummary(userId, homeId, 'monthly');

    // Get budget info - use default if home isn't fully populated
    const budget = (req.user.home && req.user.home.settings?.budget?.monthly) || 2000;
    const budgetUsagePercentage = (report.summary.totalCost / budget) * 100;

    res.json({
      ...report,
      budget: {
        monthly: budget,
        used: report.summary.totalCost,
        percentage: Math.round(budgetUsagePercentage),
        remaining: Math.round((budget - report.summary.totalCost) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cost breakdown
router.get('/cost-breakdown', async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange(period, startDate, endDate);
    const costBreakdown = await reportService.calculateCostBreakdown(homeId, start, end);

    res.json({
      period,
      dateRange: { start, end },
      ...costBreakdown
    });
  } catch (error) {
    console.error('Cost breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get goal progress report
router.get('/goal-progress', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    const { start, end } = reportService.getDateRange(period);
    const goalStatus = await reportService.calculateGoalProgress(userId, homeId, start, end);

    // Get all user goals
    const goals = await Goal.find({
      user: userId,
      home: homeId
    }).sort({ createdAt: -1 });

    res.json({
      period,
      dateRange: { start, end },
      currentStatus: goalStatus,
      allGoals: goals.map(g => ({
        id: g._id,
        type: g.type,
        period: g.period,
        target: g.target,
        current: g.current,
        status: g.status,
        startDate: g.startDate,
        endDate: g.endDate
      }))
    });
  } catch (error) {
    console.error('Goal progress error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get peak hours analysis
router.get('/peak-hours', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange(period);
    const peakHours = await reportService.calculatePeakHours(homeId, start, end);

    // Find the top expensive hours
    const sortedHours = [...peakHours].sort((a, b) => b.cost - a.cost);
    const topExpensiveHours = sortedHours.slice(0, 5);

    // Calculate peak vs off-peak distribution
    const peakCost = peakHours.filter(h => h.isPeakTariff).reduce((sum, h) => sum + h.cost, 0);
    const offPeakCost = peakHours.filter(h => !h.isPeakTariff).reduce((sum, h) => sum + h.cost, 0);
    const totalCost = peakCost + offPeakCost;

    res.json({
      period,
      dateRange: { start, end },
      hourlyData: peakHours,
      topExpensiveHours,
      summary: {
        peakCost: Math.round(peakCost * 100) / 100,
        offPeakCost: Math.round(offPeakCost * 100) / 100,
        peakPercentage: totalCost > 0 ? Math.round((peakCost / totalCost) * 100) : 0,
        mostExpensiveHour: topExpensiveHours[0]?.hour || 18,
        recommendation: peakCost > offPeakCost * 0.5
          ? 'Consider shifting usage to off-peak hours (10 PM - 6 AM) to save money'
          : 'Good job! Most of your usage is during off-peak hours'
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device efficiency report
router.get('/device-efficiency', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange(period);
    const deviceStats = await reportService.calculateDeviceStats(homeId, start, end);

    // Categorize devices by efficiency
    const efficient = deviceStats.filter(d => d.efficiencyScore >= 80);
    const moderate = deviceStats.filter(d => d.efficiencyScore >= 60 && d.efficiencyScore < 80);
    const inefficient = deviceStats.filter(d => d.efficiencyScore < 60);

    // Calculate potential savings from inefficient devices
    const potentialSavings = inefficient.reduce((sum, d) => {
      return sum + (d.totalCost * 0.25); // Assume 25% potential savings
    }, 0);

    res.json({
      period,
      dateRange: { start, end },
      devices: deviceStats,
      categories: {
        efficient: { count: efficient.length, devices: efficient },
        moderate: { count: moderate.length, devices: moderate },
        inefficient: { count: inefficient.length, devices: inefficient }
      },
      summary: {
        avgEfficiency: deviceStats.length > 0
          ? Math.round(deviceStats.reduce((sum, d) => sum + d.efficiencyScore, 0) / deviceStats.length)
          : 0,
        potentialMonthlySavings: Math.round(potentialSavings * 100) / 100,
        topRecommendation: inefficient.length > 0
          ? `Consider upgrading ${inefficient[0].deviceName} for better efficiency`
          : 'All devices are running efficiently!'
      }
    });
  } catch (error) {
    console.error('Device efficiency error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get automation impact report
router.get('/automation-impact', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange(period);
    const automationImpact = await reportService.calculateAutomationImpact(homeId, start, end);

    res.json({
      period,
      dateRange: { start, end },
      ...automationImpact,
      summary: {
        averageSavingsPerRule: automationImpact.rulesTriggered > 0
          ? Math.round((automationImpact.actualSavings / automationImpact.rulesTriggered) * 100) / 100
          : 0,
        recommendation: automationImpact.rulesTriggered < 10
          ? 'Set up more automation rules to maximize your savings'
          : `Your automations saved you ₹${automationImpact.actualSavings} this period!`
      }
    });
  } catch (error) {
    console.error('Automation impact error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get predictive forecast
router.get('/forecast', async (req, res) => {
  try {
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange('monthly');
    const forecast = await reportService.calculateForecast(homeId, start, end);

    // Get budget for comparison - use default if home isn't fully populated
    const budget = (req.user.home && req.user.home.settings?.budget?.monthly) || 2000;
    const willExceedBudget = forecast.projectedCost > budget;

    res.json({
      ...forecast,
      budget,
      willExceedBudget,
      budgetDifference: Math.round((forecast.projectedCost - budget) * 100) / 100,
      recommendation: willExceedBudget
        ? `You're projected to exceed your budget by ₹${Math.round(forecast.projectedCost - budget)}. Consider reducing usage.`
        : `You're on track to stay within budget. Expected savings: ₹${Math.round(budget - forecast.projectedCost)}`
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get carbon impact report
router.get('/carbon-impact', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const homeId = getHomeId(req.user);

    const { start, end } = reportService.getDateRange(period);
    const deviceStats = await reportService.calculateDeviceStats(homeId, start, end);

    const totalKWh = deviceStats.reduce((sum, d) => sum + d.totalWh, 0) / 1000;
    const carbonImpact = reportService.calculateCarbonImpact(totalKWh);

    res.json({
      period,
      dateRange: { start, end },
      totalEnergyKWh: Math.round(totalKWh * 100) / 100,
      ...carbonImpact,
      tips: [
        'Switch to LED bulbs to reduce emissions by 75%',
        'Use natural light during daytime',
        'Enable energy-saving mode on all devices',
        'Consider solar panels for your home'
      ]
    });
  } catch (error) {
    console.error('Carbon impact error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get efficiency insights (existing endpoint - enhanced)
router.get('/insights', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const homeId = getHomeId(req.user);
    const userId = req.user._id;

    const { start, end } = reportService.getDateRange(period);

    const [deviceStats, peakHours, goalStatus, automationImpact] = await Promise.all([
      reportService.calculateDeviceStats(homeId, start, end),
      reportService.calculatePeakHours(homeId, start, end),
      reportService.calculateGoalProgress(userId, homeId, start, end),
      reportService.calculateAutomationImpact(homeId, start, end)
    ]);

    const recommendations = reportService.generateRecommendations(
      deviceStats,
      peakHours,
      goalStatus,
      automationImpact
    );

    res.json({
      period,
      recommendations,
      deviceCount: deviceStats.length,
      topDevice: deviceStats[0],
      goalStatus: goalStatus.status
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

// What-if simulation endpoint
router.post('/what-if', async (req, res) => {
  try {
    const { deviceId, reductionHours, period = 'monthly' } = req.body;
    const homeId = getHomeId(req.user);

    const device = await Device.findOne({ _id: deviceId, home: homeId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const { start, end } = reportService.getDateRange(period);
    const deviceStats = await reportService.calculateDeviceStats(homeId, start, end);
    const currentStats = deviceStats.find(d => d.deviceId.toString() === deviceId);

    if (!currentStats) {
      return res.status(404).json({ error: 'No usage data for this device' });
    }

    // Calculate savings
    const daysInPeriod = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const hourlyRate = currentStats.totalCost / (currentStats.usageHours || 1);
    const dailyReduction = reductionHours * hourlyRate;
    const totalSavings = dailyReduction * daysInPeriod;

    const wattsReduced = device.ratedPower * reductionHours;
    const kWhReduced = (wattsReduced * daysInPeriod) / 1000;
    const co2Reduced = kWhReduced * 0.82;

    res.json({
      device: {
        id: device._id,
        name: device.name
      },
      simulation: {
        reductionHours,
        period
      },
      results: {
        costSavings: Math.round(totalSavings * 100) / 100,
        energySavings: Math.round(kWhReduced * 100) / 100,
        co2Reduction: Math.round(co2Reduced * 100) / 100,
        monthlySavingsEstimate: Math.round((totalSavings / daysInPeriod * 30) * 100) / 100,
        yearlySavingsEstimate: Math.round((totalSavings / daysInPeriod * 365) * 100) / 100
      },
      message: `Reducing ${device.name} usage by ${reductionHours} hour(s) daily could save you ₹${Math.round(totalSavings)} this ${period}`
    });
  } catch (error) {
    console.error('What-if simulation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;