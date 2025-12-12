import express from 'express';
import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';

const router = express.Router();

// Get real-time usage data
router.get('/realtime', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'No home assigned' });
    }
    const devices = await Device.find({ home: req.user.home._id });

    const realtimeData = devices.map(device => ({
      deviceId: device._id,
      name: device.name,
      category: device.category,
      currentPower: device.currentPower || 0, // Access root field
      isActive: device.isActive || false,     // Access root field
      estimatedHourlyCost: ((device.currentPower || 0) / 1000) * 5.5,
      lastUpdated: device.updatedAt
    }));

    const totalPower = realtimeData.reduce((sum, device) => sum + device.currentPower, 0);
    const totalCost = realtimeData.reduce((sum, device) => sum + device.estimatedHourlyCost, 0);

    res.json({
      devices: realtimeData,
      totals: {
        power: totalPower,
        estimatedHourlyCost: totalCost,
        estimatedDailyCost: totalCost * 24,
        estimatedMonthlyCost: totalCost * 24 * 30
      }
    });
  } catch (error) {
    console.error('Realtime Usage Error:', error); // Add logging
    res.status(500).json({ error: error.message });
  }
});

// Get usage history
router.get('/history', async (req, res) => {
  try {
    if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });
    const { period = '24h', deviceId } = req.query;

    let startDate;
    switch (period) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get user's devices first since UsageLog doesn't have home field
    const userDevices = await Device.find({ home: req.user.home._id }).select('_id');
    const deviceIds = userDevices.map(d => d._id);

    const matchQuery = {
      device: { $in: deviceIds },
      timestamp: { $gte: startDate }
    };

    if (deviceId) {
      matchQuery.device = deviceId;
    }

    const usageData = await UsageLog.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'devices',
          localField: 'device',
          foreignField: '_id',
          as: 'deviceInfo'
        }
      },
      { $unwind: '$deviceInfo' },
      {
        $group: {
          _id: {
            timestamp: {
              $dateToString: {
                format: period === '1h' ? '%H:%M' : period === '24h' ? '%H:00' : '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            device: '$device'
          },
          avgPower: { $avg: '$power' }, // Schema changed from powerConsumption to power
          totalCost: { $sum: '$cost' },
          deviceName: { $first: '$deviceInfo.name' },
          category: { $first: '$deviceInfo.category' }
        }
      },
      { $sort: { '_id.timestamp': 1 } }
    ]);

    res.json({ usageData, period });
  } catch (error) {
    console.error('Usage History Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage summary
router.get('/summary', async (req, res) => {
  try {
    if (!req.user.home) return res.status(400).json({ error: 'No home assigned' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Today's usage
    const todayUsage = await UsageLog.aggregate([
      {
        $match: {
          home: req.user.home._id,
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalPower: { $sum: '$power' }, // match new schema
          totalKwh: { $sum: { $divide: ['$power', 1000] } } // match new schema
        }
      }
    ]);

    // This month's usage
    const monthUsage = await UsageLog.aggregate([
      {
        $match: {
          home: req.user.home._id,
          timestamp: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$power', 1000] } }
        }
      }
    ]);

    // Top consuming devices today
    const topDevicesToday = await UsageLog.aggregate([
      {
        $match: {
          home: req.user.home._id,
          timestamp: { $gte: today }
        }
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'device',
          foreignField: '_id',
          as: 'deviceInfo'
        }
      },
      { $unwind: '$deviceInfo' },
      {
        $group: {
          _id: '$device',
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$power', 1000] } },
          deviceName: { $first: '$deviceInfo.name' },
          category: { $first: '$deviceInfo.category' }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 5 }
    ]);

    // Safe budget access with defaults
    const dailyBudget = req.user.home.settings?.budget?.daily || 100;
    const monthlyBudget = req.user.home.settings?.budget?.monthly || 3000;

    res.json({
      today: todayUsage[0] || { totalCost: 0, totalKwh: 0 },
      thisMonth: monthUsage[0] || { totalCost: 0, totalKwh: 0 },
      topDevicesToday,
      budget: {
        daily: dailyBudget,
        monthly: monthlyBudget,
        todayPercentage: todayUsage[0] ? (todayUsage[0].totalCost / dailyBudget) * 100 : 0,
        monthlyPercentage: monthUsage[0] ? (monthUsage[0].totalCost / monthlyBudget) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Usage Summary Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;