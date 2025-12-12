import express from 'express';
import comparisonService from '../services/comparisonService.js';
import Home from '../models/Home.js';

const router = express.Router();

// GET /comparison/profile - Get household profile
router.get('/profile', async (req, res) => {
    try {
        const home = await Home.findById(req.user.home._id);
        if (!home) return res.status(404).json({ message: 'Home not found' });

        // Check if profile exists, if not return defaults (schema default values)
        res.json(home.householdProfile || {});
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Failed to get profile' });
    }
});

// PUT /comparison/profile - Update household profile
router.put('/profile', async (req, res) => {
    try {
        const updatedProfile = await comparisonService.updateProfile(req.user.home._id, req.body);
        res.json(updatedProfile);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// GET /comparison/insights - Get comparison insights and benchmarks
router.get('/insights', async (req, res) => {
    try {
        const data = await comparisonService.getComparisonData(req.user.home._id);
        res.json(data);
    } catch (error) {
        console.error('Get comparison insights error:', error);
        res.status(500).json({ message: 'Failed to get comparison insights' });
    }
});

export default router;
