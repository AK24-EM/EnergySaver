import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';

/**
 * Baseline Modeling Service
 * Establishes normal consumption patterns to detect anomalies and measure savings
 */

class BaselineService {
    /**
     * Calculate baseline for a device over a period
     * @param {ObjectId} deviceId - Device to analyze
     * @param {Number} days - Number of days to analyze (default: 30)
     * @returns {Object} Baseline statistics
     */
    async calculateBaseline(deviceId, days = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const usageData = await UsageLog.find({
            device: deviceId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });

        if (usageData.length < 10) {
            return {
                deviceId,
                status: 'insufficient_data',
                message: 'Need at least 10 data points for baseline',
                sampleSize: usageData.length
            };
        }

        // Segment by time of day (4 segments: night, morning, afternoon, evening)
        const segments = {
            '00:00-06:00': [],
            '06:00-12:00': [],
            '12:00-18:00': [],
            '18:00-00:00': []
        };

        usageData.forEach(log => {
            const hour = log.timestamp.getHours();
            let segment;
            if (hour >= 0 && hour < 6) segment = '00:00-06:00';
            else if (hour >= 6 && hour < 12) segment = '06:00-12:00';
            else if (hour >= 12 && hour < 18) segment = '12:00-18:00';
            else segment = '18:00-00:00';

            segments[segment].push(log.power);
        });

        // Calculate statistics for each segment
        const baselineSegments = {};
        for (const [segment, powers] of Object.entries(segments)) {
            if (powers.length > 0) {
                const avg = powers.reduce((sum, p) => sum + p, 0) / powers.length;
                const variance = powers.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / powers.length;
                const stdDev = Math.sqrt(variance);

                baselineSegments[segment] = {
                    avgPower: avg,
                    stdDeviation: stdDev,
                    sampleSize: powers.length,
                    min: Math.min(...powers),
                    max: Math.max(...powers)
                };
            }
        }

        // Overall baseline
        const allPowers = usageData.map(log => log.power);
        const overallAvg = allPowers.reduce((sum, p) => sum + p, 0) / allPowers.length;
        const overallVariance = allPowers.reduce((sum, p) => sum + Math.pow(p - overallAvg, 2), 0) / allPowers.length;
        const overallStdDev = Math.sqrt(overallVariance);

        return {
            deviceId,
            period: days,
            overall: {
                avgPower: overallAvg,
                stdDeviation: overallStdDev,
                sampleSize: allPowers.length,
                min: Math.min(...allPowers),
                max: Math.max(...allPowers)
            },
            segments: baselineSegments,
            lastUpdated: new Date()
        };
    }

    /**
     * Detect if current power consumption is anomalous
     * @param {Number} currentPower - Current power reading
     * @param {Object} baseline - Baseline statistics
     * @param {Number} threshold - Number of standard deviations (default: 2)
     * @returns {Object} Anomaly detection result
     */
    detectAnomaly(currentPower, baseline, threshold = 2) {
        if (!baseline || !baseline.overall) {
            return { isAnomaly: false, reason: 'No baseline available' };
        }

        const { avgPower, stdDeviation } = baseline.overall;
        const deviation = Math.abs(currentPower - avgPower);
        const sigmas = deviation / stdDeviation;

        if (sigmas > threshold) {
            return {
                isAnomaly: true,
                severity: sigmas > 3 ? 'high' : 'medium',
                deviation: deviation,
                sigmas: sigmas.toFixed(2),
                message: `Power ${currentPower}W is ${sigmas.toFixed(1)}σ from baseline ${avgPower.toFixed(0)}W`
            };
        }

        return { isAnomaly: false, deviation: deviation, sigmas: sigmas.toFixed(2) };
    }

    /**
     * Get baselines for all devices in a home
     * @param {ObjectId} homeId - Home ID
     * @param {Number} days - Analysis period
     * @returns {Array} Baselines for all devices
     */
    async getHomeBaselines(homeId, days = 30) {
        const devices = await Device.find({ home: homeId });
        const baselines = await Promise.all(
            devices.map(device => this.calculateBaseline(device._id, days))
        );

        return baselines.filter(b => b.status !== 'insufficient_data');
    }
}

export default new BaselineService();
