import express from 'express';
import Home from '../models/Home.js';
import User from '../models/User.js';
import Member from '../models/Member.js';
import Device from '../models/Device.js';

const router = express.Router();

// Auth is already applied at the index.js level via authMiddleware

// ==========================================
// HOME PROFILE ENDPOINTS
// ==========================================

// GET /settings/home - Get home profile
router.get('/home', async (req, res) => {
    try {
        // req.user is already populated with home from authMiddleware
        const home = req.user.home;
        if (!home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        res.json({
            id: home._id,
            name: home.name,
            photo: home.photo || '',
            address: home.address || '',
            timezone: home.timezone || 'Asia/Kolkata',
            region: home.region || '',
            createdAt: home.createdAt
        });
    } catch (error) {
        console.error('Get home profile error:', error);
        res.status(500).json({ message: 'Failed to get home profile' });
    }
});

// PUT /settings/home - Update home profile
router.put('/home', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { name, photo, address, timezone, region } = req.body;

        const home = await Home.findByIdAndUpdate(
            user.home,
            {
                ...(name && { name }),
                ...(photo !== undefined && { photo }),
                ...(address !== undefined && { address }),
                ...(timezone && { timezone }),
                ...(region !== undefined && { region })
            },
            { new: true }
        );

        res.json({
            message: 'Home profile updated',
            home: {
                id: home._id,
                name: home.name,
                photo: home.photo,
                address: home.address,
                timezone: home.timezone,
                region: home.region
            }
        });
    } catch (error) {
        console.error('Update home profile error:', error);
        res.status(500).json({ message: 'Failed to update home profile' });
    }
});

// ==========================================
// TARIFF & BILLING ENDPOINTS
// ==========================================

// GET /settings/tariff - Get tariff settings
router.get('/tariff', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('home');
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const home = user.home;
        res.json({
            tariffPlan: home.tariffPlan || { type: 'flat', flatRate: 5.5, currency: 'INR' },
            billingCycleStartDay: home.billingCycleStartDay || 1,
            monthlyBudget: home.monthlyBudget || 3000
        });
    } catch (error) {
        console.error('Get tariff settings error:', error);
        res.status(500).json({ message: 'Failed to get tariff settings' });
    }
});

// PUT /settings/tariff - Update tariff settings
router.put('/tariff', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { tariffPlan, billingCycleStartDay, monthlyBudget } = req.body;

        const updateData = {};
        if (tariffPlan) updateData.tariffPlan = tariffPlan;
        if (billingCycleStartDay) updateData.billingCycleStartDay = billingCycleStartDay;
        if (monthlyBudget !== undefined) updateData.monthlyBudget = monthlyBudget;

        // Also update settings.budget for backward compatibility
        if (monthlyBudget !== undefined) {
            updateData['settings.budget.monthly'] = monthlyBudget;
        }
        if (tariffPlan?.flatRate !== undefined) {
            updateData['settings.tariffRate'] = tariffPlan.flatRate;
        }

        const home = await Home.findByIdAndUpdate(user.home, updateData, { new: true });

        res.json({
            message: 'Tariff settings updated',
            tariffPlan: home.tariffPlan,
            billingCycleStartDay: home.billingCycleStartDay,
            monthlyBudget: home.monthlyBudget
        });
    } catch (error) {
        console.error('Update tariff settings error:', error);
        res.status(500).json({ message: 'Failed to update tariff settings' });
    }
});

// ==========================================
// ROOMS & ZONES ENDPOINTS
// ==========================================

// GET /settings/rooms - Get all rooms
router.get('/rooms', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('home');
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        // Get device counts per room
        const devices = await Device.find({ home: user.home._id });
        const roomDeviceCounts = {};
        devices.forEach(device => {
            const roomName = device.location?.room || 'Unassigned';
            roomDeviceCounts[roomName] = (roomDeviceCounts[roomName] || 0) + 1;
        });

        const rooms = (user.home.rooms || []).map(room => ({
            id: room._id,
            name: room.name,
            floor: room.floor,
            zone: room.zone,
            icon: room.icon,
            order: room.order,
            deviceCount: roomDeviceCounts[room.name] || 0
        }));

        res.json({ rooms });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Failed to get rooms' });
    }
});

// POST /settings/rooms - Add a room
router.post('/rooms', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { name, floor, zone, icon } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        const home = await Home.findById(user.home);
        const order = home.rooms?.length || 0;

        home.rooms.push({ name, floor: floor || 'Ground', zone: zone || 'living', icon: icon || 'home', order });
        await home.save();

        const newRoom = home.rooms[home.rooms.length - 1];

        res.status(201).json({
            message: 'Room added',
            room: {
                id: newRoom._id,
                name: newRoom.name,
                floor: newRoom.floor,
                zone: newRoom.zone,
                icon: newRoom.icon,
                order: newRoom.order,
                deviceCount: 0
            }
        });
    } catch (error) {
        console.error('Add room error:', error);
        res.status(500).json({ message: 'Failed to add room' });
    }
});

// PUT /settings/rooms/:id - Update a room
router.put('/rooms/:id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { name, floor, zone, icon, order } = req.body;

        const home = await Home.findById(user.home);
        const room = home.rooms.id(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (name) room.name = name;
        if (floor) room.floor = floor;
        if (zone) room.zone = zone;
        if (icon) room.icon = icon;
        if (order !== undefined) room.order = order;

        await home.save();

        res.json({
            message: 'Room updated',
            room: {
                id: room._id,
                name: room.name,
                floor: room.floor,
                zone: room.zone,
                icon: room.icon,
                order: room.order
            }
        });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ message: 'Failed to update room' });
    }
});

// DELETE /settings/rooms/:id - Delete a room
router.delete('/rooms/:id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const home = await Home.findById(user.home);
        const room = home.rooms.id(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        room.deleteOne();
        await home.save();

        res.json({ message: 'Room deleted' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Failed to delete room' });
    }
});

// ==========================================
// MEMBERS & PERMISSIONS ENDPOINTS
// ==========================================

// GET /settings/members - Get all members
router.get('/members', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const members = await Member.find({ home: user.home })
            .populate('user', 'name email profile.avatar')
            .populate('invitedBy', 'name');

        // Also include the owner
        const home = await Home.findById(user.home).populate('owner', 'name email profile.avatar');

        const memberList = [
            {
                id: 'owner',
                userId: home.owner._id,
                name: home.owner.name,
                email: home.owner.email,
                avatar: home.owner.profile?.avatar,
                role: 'owner',
                status: 'active',
                isOwner: true
            },
            ...members.map(m => ({
                id: m._id,
                userId: m.user?._id,
                name: m.user?.name || m.email,
                email: m.email,
                avatar: m.user?.profile?.avatar,
                role: m.role,
                status: m.status,
                permissions: m.permissions,
                invitedBy: m.invitedBy?.name,
                invitedAt: m.invitedAt,
                acceptedAt: m.acceptedAt,
                isOwner: false
            }))
        ];

        res.json({ members: memberList });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: 'Failed to get members' });
    }
});

// POST /settings/members/invite - Invite a member
router.post('/members/invite', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { email, role } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if member already exists
        const existingMember = await Member.findOne({ home: user.home, email });
        if (existingMember) {
            return res.status(400).json({ message: 'Member already invited' });
        }

        // Check if the email belongs to an existing user
        const invitedUser = await User.findOne({ email });

        const defaultPermissions = Member.getDefaultPermissions(role || 'member');

        const member = new Member({
            home: user.home,
            user: invitedUser?._id,
            email,
            role: role || 'member',
            permissions: defaultPermissions,
            invitedBy: req.user._id,
            status: invitedUser ? 'active' : 'pending'
        });

        if (invitedUser) {
            member.acceptedAt = new Date();
        }

        await member.save();

        res.status(201).json({
            message: invitedUser ? 'Member added' : 'Invitation sent',
            member: {
                id: member._id,
                email: member.email,
                role: member.role,
                status: member.status,
                permissions: member.permissions
            }
        });
    } catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({ message: 'Failed to invite member' });
    }
});

// PUT /settings/members/:id - Update member role/permissions
router.put('/members/:id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const { role, permissions } = req.body;

        const member = await Member.findOne({ _id: req.params.id, home: user.home });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (role) {
            member.role = role;
            // Update permissions based on new role if not explicitly provided
            if (!permissions) {
                member.permissions = Member.getDefaultPermissions(role);
            }
        }

        if (permissions) {
            member.permissions = { ...member.permissions, ...permissions };
        }

        await member.save();

        res.json({
            message: 'Member updated',
            member: {
                id: member._id,
                role: member.role,
                permissions: member.permissions
            }
        });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ message: 'Failed to update member' });
    }
});

// DELETE /settings/members/:id - Remove member
router.delete('/members/:id', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user?.home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        const member = await Member.findOneAndDelete({ _id: req.params.id, home: user.home });
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json({ message: 'Member removed' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Failed to remove member' });
    }
});

// ==========================================
// NOTIFICATION PREFERENCES ENDPOINTS
// ==========================================

// GET /settings/notifications - Get notification preferences
router.get('/notifications', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            notifications: user.preferences?.notifications || {
                email: true,
                push: true,
                sms: false,
                categories: {
                    budgetAlerts: true,
                    deviceOverload: true,
                    automationActions: true,
                    safetyOverrides: true,
                    weeklyReports: true,
                    tips: false
                },
                quietHours: {
                    enabled: false,
                    start: '22:00',
                    end: '07:00'
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Failed to get notification preferences' });
    }
});

// PUT /settings/notifications - Update notification preferences
router.put('/notifications', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { email, push, sms, categories, quietHours } = req.body;

        // Deep merge notifications
        const notifications = user.preferences?.notifications || {};

        if (email !== undefined) notifications.email = email;
        if (push !== undefined) notifications.push = push;
        if (sms !== undefined) notifications.sms = sms;

        if (categories) {
            notifications.categories = { ...notifications.categories, ...categories };
        }

        if (quietHours) {
            notifications.quietHours = { ...notifications.quietHours, ...quietHours };
        }

        user.preferences = user.preferences || {};
        user.preferences.notifications = notifications;

        await user.save();

        res.json({
            message: 'Notification preferences updated',
            notifications: user.preferences.notifications
        });
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ message: 'Failed to update notification preferences' });
    }
});

// POST /settings/notifications/subscribe - Subscribe to push notifications
router.post('/notifications/subscribe', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: 'Invalid subscription object' });
        }

        // Add subscription if not already exists
        const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(201).json({ message: 'Subscription added' });
    } catch (error) {
        console.error('Push subscription error:', error);
        res.status(500).json({ message: 'Failed to subscribe to push notifications' });
    }
});

// GET /settings/vapid-key - Get public VAPID key
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BFJFG-SQBPrRa0egs88MwOIrkZfSGvQqnfpIBRQQoJEsjNIQ7FZaZFQRDRG6jv9FEHJn_CpTxZcUPrFBCt_uR6E' });
});

export default router;
