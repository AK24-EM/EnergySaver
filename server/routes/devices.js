import express from 'express';
import Device from '../models/Device.js';
import UsageLog from '../models/UsageLog.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Get all devices for user's home
router.get('/', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }
    const devices = await Device.find({ home: req.user.home._id }).sort({ name: 1 });
    res.json({ devices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available device templates
router.get('/templates', async (req, res) => {
  try {
    import('../models/DeviceTemplate.js').then(async (module) => {
      const DeviceTemplate = module.default;
      const templates = await DeviceTemplate.find({ isActive: true }).sort({ category: 1, name: 1 });
      res.json({ templates });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new device
router.post('/', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }
    const device = new Device({
      ...req.body,
      home: req.user.home._id
    });

    await device.save();

    // Log Activity
    await logActivity(req.user.home._id, req.user._id, 'DEVICE_ADD', `Added new device: ${device.name}`);

    res.status(201).json({ device, message: 'Device added successfully' });
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, home: req.user.home._id },
      req.body,
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Emit real-time update
    if (global.io) {
      global.io.to(req.user.home._id.toString()).emit('deviceUpdate', {
        deviceId: device._id,
        isActive: device.isActive,
        currentPower: device.currentPower,
        status: device.status,
        timestamp: new Date()
      });
    }

    // Log Activity if status changed
    const actionDetails = device.isActive ? `Turned ON ${device.name}` : `Turned OFF ${device.name}`;
    await logActivity(req.user.home._id, req.user._id, 'DEVICE_TOGGLE', actionDetails, {
      deviceId: device._id,
      newState: device.isActive
    });

    res.json({ device, message: 'Device updated successfully' });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      home: req.user.home._id
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Also delete usage logs for this device
    await UsageLog.deleteMany({ device: req.params.id });

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device statistics
router.get('/:id/stats', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }
    const device = await Device.findOne({
      _id: req.params.id,
      home: req.user.home._id
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get usage data for charts
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const hourlyUsage = await UsageLog.aggregate([
      {
        $match: {
          device: device._id,
          timestamp: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          avgPower: { $avg: '$powerConsumption' },
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyUsage = await UsageLog.aggregate([
      {
        $match: {
          device: device._id,
          timestamp: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgPower: { $avg: '$powerConsumption' },
          totalCost: { $sum: '$cost' },
          totalKwh: { $sum: { $divide: ['$powerConsumption', 1000] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      device,
      stats: {
        hourlyUsage,
        dailyUsage,
        efficiencyScore: device.getEfficiencyScore(),
        currentStatus: {
          power: device.status.currentPower,
          isActive: device.status.isActive,
          lastUpdated: device.status.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle device automation
router.post('/:id/automation', async (req, res) => {
  try {
    const { type, enabled, settings } = req.body;
    console.log(`[Automation Update] Device: ${req.params.id}, Type: ${type}, Enabled: ${enabled}, Settings:`, settings);

    const device = await Device.findOne({
      _id: req.params.id,
      home: req.user.home._id
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.automation) {
      device.automation = { dailyLimit: {}, schedule: {} };
    }

    if (type === 'dailyLimit') {
      if (enabled !== undefined) device.automation.dailyLimit.enabled = enabled;
      if (settings) {
        if (settings.threshold !== undefined) device.automation.dailyLimit.threshold = settings.threshold;
        if (settings.action !== undefined) device.automation.dailyLimit.action = settings.action;
      }
    } else if (type === 'schedule') {
      if (enabled !== undefined) device.automation.schedule.enabled = enabled;
      if (settings) {
        if (settings.startTime !== undefined) device.automation.schedule.startTime = settings.startTime;
        if (settings.endTime !== undefined) device.automation.schedule.endTime = settings.endTime;
        if (settings.action !== undefined) device.automation.schedule.action = settings.action;
      }
    }

    await device.save();
    console.log('[Automation Update] Saved:', device.automation);

    res.json({ device, message: 'Automation settings updated' });
  } catch (error) {
    console.error('Automation update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk Optimization
router.post('/optimization', async (req, res) => {
  try {
    if (!req.user.home) {
      return res.status(400).json({ error: 'User does not have a home assigned' });
    }

    const { type } = req.body;
    let result = { modifiedCount: 0, message: 'No changes made' };

    if (type === 'turnOffIdle') {
      // Definition of Idle: Active but consuming less than 20W (e.g. standby)
      const updateResult = await Device.updateMany(
        {
          home: req.user.home._id,
          isActive: true,
          currentPower: { $lt: 20 }
        },
        {
          $set: { isActive: false, currentPower: 0, status: 'off' }
        }
      );

      result = {
        modifiedCount: updateResult.modifiedCount,
        message: `Turned off ${updateResult.modifiedCount} idle devices`
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error optimizing devices:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;