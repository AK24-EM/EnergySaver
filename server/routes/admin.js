import express from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';
import Home from '../models/Home.js';
import User from '../models/User.js';

const router = express.Router();

// Admin middleware for all routes
router.use(adminMiddleware);

// Get community overview
router.get('/overview', async (req, res) => {
  try {
    const totalHomes = await Home.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();

    // Today's community usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await UsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$powerConsumption', 1000] } },
          avgPower: { $avg: '$powerConsumption' }
        }
      }
    ]);

    // Top consuming homes
    const topHomes = await UsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$home',
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$powerConsumption', 1000] } }
        }
      },
      {
        $lookup: {
          from: 'homes',
          localField: '_id',
          foreignField: '_id',
          as: 'homeInfo'
        }
      },
      { $unwind: '$homeInfo' },
      { $sort: { totalCost: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      stats: {
        totalHomes,
        totalUsers,
        totalDevices,
        todayUsage: todayUsage[0] || { totalCost: 0, totalKwh: 0, avgPower: 0 }
      },
      topHomes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get community analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
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
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Device category usage
    const categoryUsage = await UsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
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
          _id: '$deviceInfo.category',
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$powerConsumption', 1000] } },
          deviceCount: { $addToSet: '$device' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalCost: 1,
          totalKwh: 1,
          deviceCount: { $size: '$deviceCount' },
          avgCostPerDevice: { $divide: ['$totalCost', { $size: '$deviceCount' }] }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    // Peak usage hours
    const peakHours = await UsageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          totalCost: { $sum: '$cost' },
          avgPower: { $avg: '$powerConsumption' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      period,
      analytics: {
        categoryUsage,
        peakHours
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DEVICE TEMPLATES ENDPOINTS
// ==========================================

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    import('../models/DeviceTemplate.js').then(async (module) => {
      const DeviceTemplate = module.default;
      const templates = await DeviceTemplate.find().sort({ category: 1, name: 1 });
      res.json({ templates });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    import('../models/DeviceTemplate.js').then(async (module) => {
      const DeviceTemplate = module.default;
      const template = await DeviceTemplate.create(req.body);
      res.status(201).json({ template });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/templates/:id', async (req, res) => {
  try {
    import('../models/DeviceTemplate.js').then(async (module) => {
      const DeviceTemplate = module.default;
      const template = await DeviceTemplate.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ template });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
  try {
    import('../models/DeviceTemplate.js').then(async (module) => {
      const DeviceTemplate = module.default;
      const template = await DeviceTemplate.findByIdAndDelete(req.params.id);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ message: 'Template deleted' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
