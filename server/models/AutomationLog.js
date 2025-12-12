import mongoose from 'mongoose';

const automationLogSchema = new mongoose.Schema({
    rule: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRule' },
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },

    action: {
        type: { type: String, required: true },
        devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
        parameters: mongoose.Schema.Types.Mixed
    },

    trigger: {
        triggerType: String,
        value: mongoose.Schema.Types.Mixed
    },

    reasoning: String,

    safetyChecks: [{
        check: String,
        passed: Boolean,
        reason: String
    }],

    estimatedImpact: {
        savings: Number,
        affectedDevices: Number,
        duration: Number
    },

    actualImpact: {
        savings: Number,
        duration: Number
    },

    executed: { type: Boolean, default: false },
    skipReason: String,

    userResponse: {
        type: { type: String, enum: ['accepted', 'undone', 'ignored'] },
        timestamp: Date,
        responseTime: Number // milliseconds
    },

    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
});

// Index for efficient querying
automationLogSchema.index({ home: 1, timestamp: -1 });
automationLogSchema.index({ rule: 1, timestamp: -1 });

export default mongoose.model('AutomationLog', automationLogSchema);
