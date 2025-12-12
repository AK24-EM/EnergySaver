import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';
import baselineService from './baselineService.js';

/**
 * Savings Calculation Service
 * Quantifies actual savings vs baseline with confidence intervals
 */

class SavingsService {
    /**
     * Calculate savings for a period
     * @param {ObjectId} homeId - Home ID
     * @param {String} period - Period ('7d', '30d')
     * @returns {Object} Savings data with confidence
     */
    async calculateSavings(homeId, period = '7d') {
        const days = period === '7d' ? 7 : 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get devices for this home
        const devices = await Device.find({ home: homeId });
        const deviceIds = devices.map(d => d._id);

        // Get actual usage for the period
        const actualUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: startDate } } },
            { $group: { _id: null, totalPower: { $sum: '$power' }, totalCost: { $sum: '$cost' } } }
        ]);

        const actual = actualUsage[0] || { totalPower: 0, totalCost: 0 };

        // Get baselines for all devices
        const baselines = await Promise.all(
            devices.map(async (device) => {
                const baseline = await baselineService.calculateBaseline(device._id, 30);
                return { device: device._id, baseline };
            })
        );

        // Calculate expected usage based on baseline
        const hoursInPeriod = days * 24;
        let expectedPower = 0;
        let baselineDataPoints = 0;

        baselines.forEach(({ baseline }) => {
            if (baseline.overall && baseline.overall.avgPower) {
                expectedPower += baseline.overall.avgPower * hoursInPeriod;
                baselineDataPoints += baseline.overall.sampleSize;
            }
        });

        // Get tariff rate (default 5.5 if not available)
        const tariffRate = 5.5; // ₹/kWh
        const expectedCost = (expectedPower / 1000) * tariffRate;

        // Calculate savings
        const savingsAmount = expectedCost - actual.totalCost;
        const savingsPercentage = expectedCost > 0 ? (savingsAmount / expectedCost) * 100 : 0;

        // Confidence scoring
        let confidence = 'low';
        let confidenceScore = 0;

        if (baselineDataPoints >= 30 * 24) { // 30 days of hourly data
            confidence = 'high';
            confidenceScore = 0.85;
        } else if (baselineDataPoints >= 14 * 24) { // 14 days
            confidence = 'medium';
            confidenceScore = 0.65;
        } else {
            confidence = 'low';
            confidenceScore = 0.40;
        }

        return {
            period: days,
            actual: {
                power: actual.totalPower,
                cost: actual.totalCost
            },
            expected: {
                power: expectedPower,
                cost: expectedCost
            },
            savings: {
                amount: savingsAmount,
                percentage: savingsPercentage,
                currency: '₹'
            },
            confidence: {
                level: confidence,
                score: confidenceScore,
                dataPoints: baselineDataPoints,
                message: this.getConfidenceMessage(confidence, baselineDataPoints)
            }
        };
    }

    /**
     * Get confidence message
     */
    getConfidenceMessage(level, dataPoints) {
        if (level === 'high') {
            return `High confidence based on ${Math.floor(dataPoints / 24)} days of data`;
        } else if (level === 'medium') {
            return `Medium confidence - need more data for accuracy`;
        } else {
            return `Low confidence - collecting baseline data (${Math.floor(dataPoints / 24)} days so far)`;
        }
    }

    /**
     * Get savings breakdown by action/recommendation
     * @param {ObjectId} homeId - Home ID
     * @param {String} period - Period
     * @returns {Array} Breakdown of savings by action
     */
    async getSavingsBreakdown(homeId, period = '7d') {
        // For MVP, return placeholder
        // In production, this would track which recommendations were followed
        return [
            {
                action: 'Reduced peak hour usage',
                savings: 45.50,
                period: 'Last 7 days',
                confidence: 'medium'
            }
        ];
    }
}

export default new SavingsService();
