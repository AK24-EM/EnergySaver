import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Get recent activity
router.get('/', async (req, res) => {
    try {
        if (!req.user.home) {
            return res.status(400).json({ error: 'User does not have a home assigned' });
        }

        const { limit = 20 } = req.query;

        const logs = await ActivityLog.find({ home: req.user.home._id })
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .populate('user', 'name');

        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to create log (can be imported elsewhere)
export const logActivity = async (homeId, userId, action, details, metadata = {}) => {
    try {
        await ActivityLog.create({
            home: homeId,
            user: userId,
            action,
            details,
            metadata
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

export default router;
