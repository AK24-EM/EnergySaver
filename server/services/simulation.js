import Device from '../models/Device.js';
import UsageLog from '../models/UsageLog.js';
import { createAlert } from './alertService.js';
import logger from '../utils/logger.js';

const DEVICE_PATTERNS = {
  'AC': {
    seasonalMultiplier: (month) => month >= 4 && month <= 9 ? 1.8 : 0.3,
    usagePattern: (hour) => {
      if (hour >= 14 && hour <= 21) return 0.8 + Math.random() * 0.2;
      if (hour >= 9 && hour <= 13) return 0.4 + Math.random() * 0.3;
      if (hour >= 22 || hour <= 6) return 0.6 + Math.random() * 0.4;
      return 0.1 + Math.random() * 0.2;
    }
  },
  'Refrigerator': {
    seasonalMultiplier: (month) => month >= 4 && month <= 9 ? 1.3 : 1.0,
    usagePattern: () => 0.8 + Math.random() * 0.2
  },
  'Washing Machine': {
    seasonalMultiplier: () => 1.0,
    usagePattern: (hour) => {
      if ([7, 8, 19, 20].includes(hour)) return Math.random() > 0.7 ? 1.0 : 0;
      return 0;
    }
  },
  'TV': {
    seasonalMultiplier: () => 1.0,
    usagePattern: (hour) => {
      if (hour >= 18 && hour <= 23) return 0.7 + Math.random() * 0.3;
      if (hour >= 8 && hour <= 10) return 0.3 + Math.random() * 0.2;
      return 0.1;
    }
  },
  'Lighting': {
    seasonalMultiplier: () => 1.0,
    usagePattern: (hour) => {
      if (hour >= 18 && hour <= 23) return 0.9 + Math.random() * 0.1;
      if (hour >= 6 && hour <= 8) return 0.6 + Math.random() * 0.2;
      return 0.2 + Math.random() * 0.1;
    }
  },
  'Entertainment': {
    seasonalMultiplier: () => 1.0,
    usagePattern: (hour) => {
      if (hour >= 18 && hour <= 23) return 0.8 + Math.random() * 0.2;
      return 0.1;
    }
  },
  'Kitchen': {
    seasonalMultiplier: () => 1.0,
    usagePattern: (hour) => {
      if ((hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 20)) return 0.8 + Math.random() * 0.2;
      return 0.1;
    }
  },
  // Default fallback
  'Other': {
    seasonalMultiplier: () => 1.0,
    usagePattern: () => 0.1
  }
};

let simulationInterval;

export const initializeSimulation = (io) => {
  logger.info('Initializing energy usage simulation...');
  simulationInterval = setInterval(async () => {
    await runSimulationCycle(io);
  }, 30000);
  runSimulationCycle(io);
};

const runSimulationCycle = async (io) => {
  try {
    const devices = await Device.find().populate('home');
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;

    for (const device of devices) {
      if (!device.ratedPower) continue;

      const pattern = DEVICE_PATTERNS[device.category] || DEVICE_PATTERNS['Other'];
      const seasonalMultiplier = pattern.seasonalMultiplier ? pattern.seasonalMultiplier(month) : 1.0;
      const usageMultiplier = pattern.usagePattern ? pattern.usagePattern(hour) : 0.5;

      const randomFactor = 0.8 + Math.random() * 0.4;
      // Use ratedPower instead of specifications.wattage
      const currentPower = Math.round(device.ratedPower * seasonalMultiplier * usageMultiplier * randomFactor);
      const isActive = currentPower > (device.ratedPower * 0.1);

      // Update device status (New Schema: flat fields)
      device.currentPower = currentPower;
      device.isActive = isActive;
      device.status = isActive ? 'on' : 'off';
      // No 'usage' object update as per new requirements

      await device.save();

      // Calculate cost (Assuming flat 5.5 if home tariff not available)
      const tariffRate = device.home?.tariffPlan?.flatRate || 5.5;
      const intervalHours = 30 / 3600;
      const energyConsumed = (currentPower / 1000) * intervalHours;
      const cost = energyConsumed * tariffRate;

      // Create UsageLog (New Schema)
      logger.info(`Creating UsageLog for device ${device._id}: power=${currentPower}, cost=${cost}`);
      const usageLog = new UsageLog({
        device: device._id,
        timestamp: now,
        power: currentPower,
        cost: cost
      });

      try {
        await usageLog.save();
        logger.info(`UsageLog saved successfully for device ${device._id}`);
      } catch (saveError) {
        logger.error('UsageLog save error:', {
          error: saveError.message,
          device: device._id,
          power: currentPower,
          cost: cost
        });
      }

      // Check for alerts
      await checkForAlerts(device, currentPower, cost);

      // Emit real-time updates
      if (io && device.home) {
        io.to(device.home._id.toString()).emit('deviceUpdate', {
          deviceId: device._id,
          currentPower,
          isActive,
          cost,
          timestamp: now
        });
      }
    }
    logger.info(`Simulation cycle completed for ${devices.length} devices`);
  } catch (error) {
    logger.error('Simulation error:', error);
  }
};

const checkForAlerts = async (device, currentPower, cost) => {
  try {
    if (!device.home) return;

    // Spike Alert
    if (currentPower > device.ratedPower * 1.2) {
      await createAlert({
        home: device.home._id,
        device: device._id,
        type: 'anomaly', // Updated enum
        severity: 'warning',
        message: `${device.name} is consuming ${currentPower}W, exceeding rated power of ${device.ratedPower}W.`
      });
    }

  } catch (error) {
    logger.error('Alert check error:', error);
  }
};

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    logger.info('Simulation stopped');
  }
};