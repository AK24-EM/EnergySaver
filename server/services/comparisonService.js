import Home from '../models/Home.js';
import Benchmark from '../models/Benchmark.js';
import UsageLog from '../models/UsageLog.js';
import Device from '../models/Device.js';

/**
 * Service to handle neighborhood comparison logic
 */

// Generate cluster ID based on home profile
const getClusterId = (profile) => {
    const devices = [];
    if (profile.hasAC) devices.push('AC');
    if (profile.hasHeater) devices.push('Heater');
    if (profile.hasSolar) devices.push('Solar');

    const deviceStr = devices.length > 0 ? devices.join('-') : 'basic';
    return `${profile.rooms}room-${profile.climateZone}-${deviceStr}`;
};

// Calculate user metrics for the current month
const calculateUserMetrics = async (homeId) => {
    const home = await Home.findById(homeId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all devices
    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    // Get usage logs
    const logs = await UsageLog.find({
        device: { $in: deviceIds },
        timestamp: { $gte: startOfMonth }
    });

    const totalKwh = logs.reduce((sum, log) => sum + (log.power || 0), 0) / 1000;

    // Calculate Peak Usage % (6 PM - 10 PM)
    const peakLogs = logs.filter(log => {
        const h = new Date(log.timestamp).getHours();
        return h >= 18 && h <= 22;
    });
    const peakKwh = peakLogs.reduce((sum, log) => sum + (log.power || 0), 0) / 1000;
    const peakPercent = totalKwh > 0 ? (peakKwh / totalKwh) * 100 : 0;

    // Calculate Standby Waste (lowest usage hour * 24)
    // Simplified: Find hour with min usage and assume that's "always on" load
    // A better approach would be to look at non-active devices, but this is a proxy

    const carbonKg = totalKwh * 0.82;

    return {
        kwhPerCapita: totalKwh / (home.householdProfile.size || 2),
        peakUsagePercent: peakPercent,
        carbonKg: carbonKg,
        totalKwh
    };
};

// Generate insights based on comparison
const generateInsights = (userMetrics, benchmark) => {
    const insights = [];
    const bm = benchmark.metrics;

    // Insight 1: Overall Efficiency
    const diffKwh = userMetrics.kwhPerCapita - bm.avgKwhPerCapita;
    if (diffKwh > 0) {
        const percentHigher = ((diffKwh / bm.avgKwhPerCapita) * 100).toFixed(0);
        insights.push({
            type: 'warning',
            title: 'High Consumption',
            message: `Your energy use per person is ${percentHigher}% higher than similar homes.`,
            metric: 'kwhPerCapita',
            gap: diffKwh
        });
    } else {
        insights.push({
            type: 'success',
            title: 'Efficient Home',
            message: 'You are using less energy per person than the average similar home.',
            metric: 'kwhPerCapita'
        });
    }

    // Insight 2: Peak Usage
    if (userMetrics.peakUsagePercent > bm.avgPeakUsagePercent + 5) {
        insights.push({
            type: 'warning',
            title: 'High Peak Usage',
            message: `Your evening usage (${userMetrics.peakUsagePercent.toFixed(0)}%) is higher than the cluster average (${bm.avgPeakUsagePercent.toFixed(0)}%). Consider shifting AC/Laundry to off-peak hours.`,
            metric: 'peakUsagePercent'
        });
    }

    return insights;
};

// Get comparison data for a home
export const getComparisonData = async (homeId) => {
    const home = await Home.findById(homeId);
    if (!home) throw new Error('Home not found');

    // Ensure profile exists
    if (!home.householdProfile) {
        home.householdProfile = {}; // defaults will apply
    }

    const clusterId = getClusterId(home.householdProfile);

    // Try to find real benchmark
    let benchmark = await Benchmark.findOne({ clusterId });

    // Fallback to Synthetic if no real data or sample too small
    if (!benchmark || benchmark.sampleSize < 20) {
        // Create or use synthetic
        benchmark = {
            clusterId,
            sampleSize: 0,
            isSynthetic: true,
            metrics: {
                avgKwhPerCapita: 120, // Synthetic average
                avgPeakUsagePercent: 15,
                avgCarbonKg: 200,
                avgStandbyWaste: 10
            },
            percentiles: {
                p25: 90,
                p50: 120,
                p75: 160,
                p90: 200
            },
            confidence: 0 // Low confidence
        };

        // Adjust synthetic based on profile for realism
        if (home.householdProfile.hasAC) benchmark.metrics.avgKwhPerCapita += 50;
        if (home.householdProfile.climateZone === 'tropical') benchmark.metrics.avgKwhPerCapita += 30;

        benchmark.percentiles.p50 = benchmark.metrics.avgKwhPerCapita;
    }

    const userMetrics = await calculateUserMetrics(homeId);

    // Calculate percentile rank
    let percentile = 50;
    if (userMetrics.kwhPerCapita < benchmark.percentiles.p25) percentile = 90; // Very efficient
    else if (userMetrics.kwhPerCapita < benchmark.percentiles.p50) percentile = 75;
    else if (userMetrics.kwhPerCapita < benchmark.percentiles.p75) percentile = 40;
    else percentile = 20; // Inefficient

    return {
        cluster: {
            id: clusterId,
            size: benchmark.sampleSize,
            criteria: home.householdProfile,
            isSynthetic: !!benchmark.isSynthetic
        },
        userMetrics,
        benchmarkMetrics: benchmark.metrics,
        efficiencyRank: percentile,
        insights: generateInsights(userMetrics, benchmark)
    };
};

// Update household profile
export const updateProfile = async (homeId, profileData) => {
    const home = await Home.findById(homeId);
    if (!home) throw new Error('Home not found');

    home.householdProfile = { ...home.householdProfile, ...profileData };
    home.clusterLabel = getClusterId(home.householdProfile);
    await home.save();

    return home.householdProfile;
};

// (Optional) Recalculate Benchmarks Cron Job Function
// This would be run nightly to aggregate data from all homes and update Benchmark collection
export const aggregateBenchmarks = async () => {
    // Logic to grouping homes by clusterId, calculating avgs, updating Benchmark models
    // Omitted for brevity in this step, but placeholders are important for real-world
};

export default {
    getComparisonData,
    updateProfile,
    aggregateBenchmarks
};
