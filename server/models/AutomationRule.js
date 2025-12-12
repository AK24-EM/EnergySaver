import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
    name: { type: String, required: true },
    description: String,
    enabled: { type: Boolean, default: true },
    priority: { type: Number, min: 1, max: 10, default: 5 },

    trigger: {
        type: { type: String, enum: ['time', 'condition', 'event'], required: true },
        // Time-based trigger
        schedule: {
            hour: Number,
            minute: Number,
            days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }]
        },
        // Condition-based trigger
        condition: {
            type: { type: String, enum: ['power_threshold', 'budget_threshold', 'device_state'] },
            value: mongoose.Schema.Types.Mixed
        },
        // Event-based trigger
        event: {
            type: { type: String, enum: ['tariff_change', 'peak_detected', 'user_away'] },
            value: String
        }
    },

    action: {
        type: { type: String, enum: ['turn_off', 'turn_on', 'set_mode', 'reduce_power'], required: true },
        devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
        deviceFilter: { type: String, enum: ['all', 'all_except', 'category'] },
        exceptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
        parameters: {
            mode: String,
            reduction: Number,
            targetTemp: Number
        }
    },

    constraints: {
        maxDevices: { type: Number, default: 10 },
        minSavings: { type: Number, default: 5 },
        comfortLimits: {
            minTemp: Number,
            maxTemp: Number
        }
    },

    overrides: {
        allowManualOverride: { type: Boolean, default: true },
        overrideDuration: { type: Number, default: 120 }, // minutes
        pauseIfRecentActivity: { type: Boolean, default: true }
    },

    metadata: {
        lastTriggered: Date,
        triggerCount: { type: Number, default: 0 },
        undoCount: { type: Number, default: 0 },
        successRate: { type: Number, default: 100 }
    }
}, {
    timestamps: true
});

// Calculate success rate before saving
automationRuleSchema.pre('save', function (next) {
    if (this.metadata.triggerCount > 0) {
        this.metadata.successRate = ((this.metadata.triggerCount - this.metadata.undoCount) / this.metadata.triggerCount) * 100;
    }
    next();
});

export default mongoose.model('AutomationRule', automationRuleSchema);
