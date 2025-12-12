import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Report period configuration
    dateRange: {
        type: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], required: true },
        start: { type: Date, required: true },
        end: { type: Date, required: true }
    },

    // Device-level statistics
    deviceStats: [{
        deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
        deviceName: String,
        category: String,
        totalWh: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        usageHours: { type: Number, default: 0 },
        efficiencyScore: { type: Number, default: 0 },
        avgDailyUsage: { type: Number, default: 0 }
    }],

    // Peak usage analysis
    peakHours: [{
        hour: { type: Number, min: 0, max: 23 },
        power: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
        isPeakTariff: { type: Boolean, default: false }
    }],

    // Goal tracking
    goalStatus: {
        targetKWh: { type: Number, default: 0 },
        usedKWh: { type: Number, default: 0 },
        targetCost: { type: Number, default: 0 },
        usedCost: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        status: { type: String, enum: ['on_track', 'at_risk', 'exceeded', 'completed'], default: 'on_track' }
    },

    // Automation impact tracking
    automationImpact: {
        rulesTriggered: { type: Number, default: 0 },
        estimatedSavings: { type: Number, default: 0 },
        actualSavings: { type: Number, default: 0 },
        topRules: [{
            ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRule' },
            ruleName: String,
            savings: Number,
            timesTriggered: Number
        }]
    },

    // Cost breakdown
    costBreakdown: {
        byDevice: [{
            deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
            deviceName: String,
            cost: Number,
            percentage: Number
        }],
        byCategory: [{
            category: String,
            cost: Number,
            percentage: Number
        }],
        byTimeOfDay: [{
            period: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'] },
            cost: Number,
            percentage: Number
        }]
    },

    // Predictive forecasting
    forecast: {
        projectedCost: { type: Number, default: 0 },
        projectedUsage: { type: Number, default: 0 },
        confidence: { type: Number, min: 0, max: 100, default: 0 },
        trend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
        projectedSavings: { type: Number, default: 0 }
    },

    // Carbon impact (optional)
    carbonImpact: {
        kgCO2: { type: Number, default: 0 },
        treesEquivalent: { type: Number, default: 0 },
        comparedToAverage: { type: Number, default: 0 } // percentage vs average household
    },

    // Summary metrics
    summary: {
        totalEnergy: { type: Number, default: 0 }, // kWh
        totalCost: { type: Number, default: 0 },
        avgDailyCost: { type: Number, default: 0 },
        avgDailyUsage: { type: Number, default: 0 },
        peakUsageTime: String, // e.g., "18:00-19:00"
        mostExpensiveDevice: String,
        savingsVsPrevious: { type: Number, default: 0 },
        savingsPercentage: { type: Number, default: 0 }
    },

    // Overuse alerts within this period
    alerts: [{
        type: { type: String, enum: ['overuse', 'anomaly', 'goal_risk', 'efficiency_drop'] },
        deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
        message: String,
        severity: { type: String, enum: ['info', 'warning', 'critical'] },
        timestamp: Date
    }],

    // Savings recommendations
    recommendations: [{
        category: { type: String, enum: ['device', 'behavior', 'automation', 'upgrade'] },
        title: String,
        description: String,
        potentialSavings: Number,
        priority: { type: String, enum: ['low', 'medium', 'high'] }
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
reportSchema.index({ home: 1, 'dateRange.type': 1, 'dateRange.start': -1 });
reportSchema.index({ user: 1, 'dateRange.start': -1 });

export default mongoose.model('Report', reportSchema);
