import Alert from '../models/Alert.js';
import logger from '../utils/logger.js';

export const createAlert = async (alertData) => {
  try {
    // Check if similar alert exists in last hour
    const existingAlert = await Alert.findOne({
      home: alertData.home,
      device: alertData.device,
      type: alertData.type,
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });
    
    if (existingAlert) {
      // Update existing alert instead of creating new one
      existingAlert.data = alertData.data;
      existingAlert.updatedAt = new Date();
      await existingAlert.save();
      return existingAlert;
    }
    
    // Create new alert
    const alert = new Alert(alertData);
    await alert.save();
    
    // Emit to connected clients
    if (global.io) {
      global.io.to(alertData.home.toString()).emit('newAlert', alert);
    }
    
    logger.info(`Alert created: ${alert.title}`);
    return alert;
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
};

export const getActiveAlerts = async (homeId) => {
  return Alert.find({
    home: homeId,
    status: 'active',
    expiresAt: { $gte: new Date() }
  }).sort({ createdAt: -1 });
};

export const acknowledgeAlert = async (alertId, userId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw new Error('Alert not found');
  
  alert.status = 'acknowledged';
  alert.actionTaken = `Acknowledged by user ${userId}`;
  await alert.save();
  
  return alert;
};

export const dismissAlert = async (alertId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw new Error('Alert not found');
  
  alert.status = 'dismissed';
  await alert.save();
  
  return alert;
};