import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Home from '../models/Home.js';
import Member from '../models/Member.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, homeData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Check for pending invitation
    const pendingInvite = await Member.findOne({ email, status: 'pending' });

    let home;
    let user;

    if (pendingInvite) {
      // User is accepting an invitation - Join EXISTING home
      home = await Home.findById(pendingInvite.home);
      if (!home) {
        return res.status(404).json({ error: 'Invited home no longer exists' });
      }

      user = new User({
        name,
        email,
        password,
        role: pendingInvite.role, // Inherit role from invitation
        home: home._id,
        profile: {
          tariffRate: homeData.tariffRate || 5.5
        }
      });

      // Update the member record
      pendingInvite.user = user._id;
      pendingInvite.status = 'active';
      pendingInvite.acceptedAt = new Date();
      await pendingInvite.save();

      await user.save();
    } else {
      // Standard registration - Create NEW home
      home = new Home({
        name: homeData.name,
        address: homeData.address,
        owner: null // Will be set after user creation
      });

      user = new User({
        name,
        email,
        password,
        role: 'owner', // Default role for new home creator
        profile: {
          tariffRate: homeData.tariffRate || 5.5
        }
      });

      // Link User <-> Home
      home.owner = user._id;
      user.home = home._id;

      await home.save();
      await user.save();
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: pendingInvite ? 'Joined home successfully' : 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        home: home._id
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include home
    const user = await User.findOne({ email }).populate('home');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        home: user.home
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('home');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        home: user.home,
        profile: user.profile,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;