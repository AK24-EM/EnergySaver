import express from 'express';
import { getActiveAlerts, acknowledgeAlert, dismissAlert } from '../services/alertService.js';

const router = express.Router();

// Get all active alerts for user's home
router.get('/', async (req, res) => {
  try {
    const alerts = await getActiveAlerts(req.user.home._id);
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await acknowledgeAlert(req.params.id, req.user._id);
    res.json({ alert, message: 'Alert acknowledged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss alert
router.delete('/:id', async (req, res) => {
  try {
    await dismissAlert(req.params.id);
    res.json({ message: 'Alert dismissed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;