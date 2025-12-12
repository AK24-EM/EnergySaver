import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';

/**
 * Peak Load Prediction Service
 * Forecasts upcoming high-usage periods and suggests load shifting
 */

class PeakPredictionService {
    /**
     * Predict peak usage for next 24 hours
     * @param {ObjectId} homeId - Home ID
     * @returns {Object} Peak predictions with suggestions
     */
    async predictPeaks(homeId) {
        // Get devices for this home
        const devices = await Device.find({ home: homeId });
        const deviceIds = devices.map(d => d._id);

        // Analyze last 7 days of hourly patterns
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const hourlyPatterns = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $hour: '$timestamp' },
                    avgPower: { $avg: '$power' },
                    maxPower: { $max: '$power' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Create 24-hour forecast
        const now = new Date();
        const currentHour = now.getHours();
        const predictions = [];

        for (let i = 0; i < 24; i++) {
            const forecastHour = (currentHour + i) % 24;
            const pattern = hourlyPatterns.find(p => p._id === forecastHour);

            if (pattern && pattern.count >= 3) { // Need at least 3 data points
                const projectedLoad = pattern.avgPower;
                const probability = Math.min(pattern.count / 7, 1); // Max 1.0 if all 7 days have data

                predictions.push({
                    hour: forecastHour,
                    timeWindow: `${forecastHour.toString().padStart(2, '0')}:00-${((forecastHour + 1) % 24).toString().padStart(2, '0')}:00`,
                    projectedLoad: Math.round(projectedLoad),
                    probability: probability.toFixed(2),
                    confidence: probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low'
                });
            }
        }

        // Identify peak windows (top 25% of projected load)
        const sortedByLoad = [...predictions].sort((a, b) => b.projectedLoad - a.projectedLoad);
        const peakThreshold = sortedByLoad.length > 0 ? sortedByLoad[Math.floor(sortedByLoad.length * 0.25)]?.projectedLoad : 0;

        const peakWindows = predictions
            .filter(p => p.projectedLoad >= peakThreshold && p.projectedLoad > 500) // At least 500W to be considered peak
            .map(p => ({
                ...p,
                isPeak: true,
                suggestions: this.generateSuggestions(p, devices)
            }));

        return {
            predictions: predictions.slice(0, 12), // Next 12 hours
            peakWindows,
            summary: {
                nextPeakHour: peakWindows[0]?.hour,
                avgPeakLoad: peakWindows.length > 0
                    ? Math.round(peakWindows.reduce((sum, p) => sum + p.projectedLoad, 0) / peakWindows.length)
                    : 0,
                peakCount: peakWindows.length
            }
        };
    }

    /**
     * Generate load-shifting suggestions
     */
    generateSuggestions(peakWindow, devices) {
        const suggestions = [];

        // Suggest delaying high-power devices
        const deferrable = devices.filter(d =>
            ['Washing Machine', 'Dishwasher', 'Dryer'].includes(d.category)
        );

        if (deferrable.length > 0 && peakWindow.projectedLoad > 1000) {
            const device = deferrable[0];
            const offPeakHour = (peakWindow.hour + 4) % 24;

            suggestions.push({
                action: `Delay ${device.name} until ${offPeakHour}:00`,
                potentialSavings: 15.50, // Estimated based on tariff difference
                inconvenience: 'low',
                reason: 'Avoid peak hour tariff'
            });
        }

        // Suggest pre-cooling/heating
        if (peakWindow.hour >= 18 && peakWindow.hour <= 22) {
            const hvac = devices.find(d => d.category === 'AC' || d.category === 'Heater');
            if (hvac) {
                suggestions.push({
                    action: `Pre-cool/heat at ${peakWindow.hour - 2}:00`,
                    potentialSavings: 25.00,
                    inconvenience: 'low',
                    reason: 'Reduce load during peak hours'
                });
            }
        }

        return suggestions;
    }

    /**
     * Check if current usage will exceed daily budget
     * @param {ObjectId} homeId - Home ID
     * @param {Number} dailyBudget - Daily budget in ₹
     * @returns {Object} Budget forecast
     */
    async forecastBudgetExceedance(homeId, dailyBudget = 100) {
        const devices = await Device.find({ home: homeId });
        const deviceIds = devices.map(d => d._id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUsage = await UsageLog.aggregate([
            { $match: { device: { $in: deviceIds }, timestamp: { $gte: today } } },
            { $group: { _id: null, totalCost: { $sum: '$cost' } } }
        ]);

        const currentSpend = todayUsage[0]?.totalCost || 0;
        const hoursElapsed = new Date().getHours();
        const hoursRemaining = 24 - hoursElapsed;

        // Simple linear projection
        const projectedTotal = hoursElapsed > 0
            ? (currentSpend / hoursElapsed) * 24
            : currentSpend;

        const willExceed = projectedTotal > dailyBudget;
        const exceedanceAmount = Math.max(0, projectedTotal - dailyBudget);

        return {
            current: currentSpend,
            projected: projectedTotal,
            budget: dailyBudget,
            willExceed,
            exceedanceAmount,
            hoursRemaining,
            recommendation: willExceed
                ? `Reduce usage by ${(exceedanceAmount / hoursRemaining).toFixed(2)}₹/hour to stay on budget`
                : 'On track to meet daily budget'
        };
    }
}

export default new PeakPredictionService();
