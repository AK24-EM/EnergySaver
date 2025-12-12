import express from 'express';
import Goal from '../models/Goal.js';

const router = express.Router();

// Get all goals for user
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user._id,
      home: req.user.home._id
    }).sort({ createdAt: -1 });
    
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new goal
router.post('/', async (req, res) => {
  try {
    const goal = new Goal({
      ...req.body,
      user: req.user._id,
      home: req.user.home._id
    });
    
    await goal.save();
    res.status(201).json({ goal, message: 'Goal created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { currentValue } = req.body;
    
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    goal.current.value = currentValue;
    goal.updateProgress();
    await goal.save();
    
    res.json({ goal, message: 'Goal progress updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;