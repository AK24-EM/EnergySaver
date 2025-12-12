import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional - linked when invited user has account

    // Role-based access
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer', 'child'],
        default: 'member'
    },

    // Granular permissions
    permissions: {
        canControlDevices: { type: Boolean, default: true },
        canEditAutomation: { type: Boolean, default: false },
        canInviteMembers: { type: Boolean, default: false },
        canViewReports: { type: Boolean, default: true },
        canEditSettings: { type: Boolean, default: false },
        // Child mode - restricted devices they CAN control (empty = none)
        allowedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
        // Devices they cannot control
        restrictedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
    },

    // Invitation tracking
    email: { type: String, required: true }, // Email used for invite
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    status: {
        type: String,
        enum: ['pending', 'active', 'revoked'],
        default: 'pending'
    },

    // Activity
    lastActive: Date
}, {
    timestamps: true
});

// Ensure unique member per home
memberSchema.index({ home: 1, email: 1 }, { unique: true });

// Helper to check permission
memberSchema.methods.hasPermission = function (permission) {
    if (this.role === 'owner') return true;
    if (this.role === 'admin') return true;
    return this.permissions[permission] === true;
};

// Role-based default permissions
memberSchema.statics.getDefaultPermissions = function (role) {
    const defaults = {
        owner: {
            canControlDevices: true,
            canEditAutomation: true,
            canInviteMembers: true,
            canViewReports: true,
            canEditSettings: true
        },
        admin: {
            canControlDevices: true,
            canEditAutomation: true,
            canInviteMembers: true,
            canViewReports: true,
            canEditSettings: true
        },
        member: {
            canControlDevices: true,
            canEditAutomation: false,
            canInviteMembers: false,
            canViewReports: true,
            canEditSettings: false
        },
        viewer: {
            canControlDevices: false,
            canEditAutomation: false,
            canInviteMembers: false,
            canViewReports: true,
            canEditSettings: false
        },
        child: {
            canControlDevices: true, // Only allowed devices
            canEditAutomation: false,
            canInviteMembers: false,
            canViewReports: false,
            canEditSettings: false
        }
    };
    return defaults[role] || defaults.member;
};

export default mongoose.model('Member', memberSchema);
