import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';

/**
 * Device Health Monitoring Service
 * Detects degrading efficiency and suggests maintenance
 */

class DeviceHealthService {
    /**
     * Calculate device efficiency score
     * @param {ObjectId} deviceId - Device ID
     * @param {Number} days - Analysis period
     * @returns {Object} Health metrics
     */
    async calculateDeviceHealth(deviceId, days = 30) {
        const device = await Device.findById(deviceId);
        if (!device || !device.ratedPower) {
            return {
                deviceId,
                status: 'unknown',
                message: 'Device not found or missing rated power'
            };
        }

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Get usage data for the period
        const usageData = await UsageLog.find({
            device: deviceId,
            timestamp: { $gte: startDate },
            power: { $gt: 0 } // Only when device is active
        }).sort({ timestamp: 1 });

        if (usageData.length < 10) {
            return {
                deviceId,
                deviceName: device.name,
                status: 'insufficient_data',
                message: 'Need more usage data for health analysis',
                sampleSize: usageData.length
            };
        }

        // Calculate average actual power when device is on
        const avgActualPower = usageData.reduce((sum, log) => sum + log.power, 0) / usageData.length;

        // Efficiency score: how close to rated power (100% = perfect)
        // Lower actual power than rated = more efficient
        const efficiencyScore = Math.min(100, (device.ratedPower / avgActualPower) * 100);

        // Analyze trend (compare first half vs second half)
        const midpoint = Math.floor(usageData.length / 2);
        const firstHalf = usageData.slice(0, midpoint);
        const secondHalf = usageData.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((sum, log) => sum + log.power, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, log) => sum + log.power, 0) / secondHalf.length;

        const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        // Determine health status
        let healthStatus, recommendation;
        if (efficiencyScore >= 90) {
            healthStatus = 'excellent';
            recommendation = 'Device is operating optimally';
        } else if (efficiencyScore >= 75) {
            healthStatus = 'good';
            recommendation = 'Device is performing well';
        } else if (efficiencyScore >= 60) {
            healthStatus = 'degrading';
            recommendation = 'Consider scheduling maintenance check';
        } else {
            healthStatus = 'poor';
            recommendation = 'Immediate maintenance recommended - device may be faulty';
        }

        // Check for sudden efficiency drop
        if (trend > 10) {
            healthStatus = 'degrading';
            recommendation = `Efficiency dropped ${trend.toFixed(1)}% recently. Possible causes: ${this.getDegradationCauses(device.category)}`;
        }

        return {
            deviceId,
            deviceName: device.name,
            category: device.category,
            health: {
                status: healthStatus,
                efficiencyScore: Math.round(efficiencyScore),
                trend: trend.toFixed(1),
                trendDirection: trend > 2 ? 'degrading' : trend < -2 ? 'improving' : 'stable'
            },
            metrics: {
                ratedPower: device.ratedPower,
                avgActualPower: Math.round(avgActualPower),
                sampleSize: usageData.length,
                period: days
            },
            recommendation,
            lastAnalyzed: new Date()
        };
    }

    /**
     * Get possible degradation causes by device category
     */
    getDegradationCauses(category) {
        const causes = {
            'AC': 'Dirty filters, low refrigerant, or worn compressor',
            'Refrigerator': 'Door seal issues, dirty coils, or thermostat problems',
            'Washing Machine': 'Lint buildup, worn motor, or heating element issues',
            'Water Heater': 'Sediment buildup or heating element degradation',
            'Fan': 'Dust accumulation or bearing wear',
            'default': 'Component wear or maintenance needed'
        };

        return causes[category] || causes['default'];
    }

    /**
     * Get health status for all devices in a home
     * @param {ObjectId} homeId - Home ID
     * @returns {Array} Health status for all devices
     */
    async getHomeDevicesHealth(homeId) {
        const devices = await Device.find({ home: homeId });

        const healthReports = await Promise.all(
            devices.map(device => this.calculateDeviceHealth(device._id, 30))
        );

        // Filter out devices with insufficient data
        const validReports = healthReports.filter(r => r.health);

        // Summary statistics
        const summary = {
            total: validReports.length,
            excellent: validReports.filter(r => r.health.status === 'excellent').length,
            good: validReports.filter(r => r.health.status === 'good').length,
            degrading: validReports.filter(r => r.health.status === 'degrading').length,
            poor: validReports.filter(r => r.health.status === 'poor').length,
            avgEfficiency: validReports.length > 0
                ? Math.round(validReports.reduce((sum, r) => sum + r.health.efficiencyScore, 0) / validReports.length)
                : 0
        };

        return {
            devices: validReports,
            summary
        };
    }
}

export default new DeviceHealthService();
