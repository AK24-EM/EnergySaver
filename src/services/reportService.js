import api from './api';

/**
 * Report Service - API calls for all report endpoints
 */

export const reportService = {
    // Get complete report summary
    getSummary: async (period = 'monthly', startDate = null, endDate = null) => {
        const params = new URLSearchParams({ period });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await api.get(`/reports/summary?${params}`);
        return response;
    },

    // Get daily report
    getDaily: async () => {
        const response = await api.get('/reports/daily');
        return response;
    },

    // Get weekly report
    getWeekly: async () => {
        const response = await api.get('/reports/weekly');
        return response;
    },

    // Get monthly report
    getMonthly: async () => {
        const response = await api.get('/reports/monthly');
        return response;
    },

    // Get cost breakdown
    getCostBreakdown: async (period = 'monthly') => {
        const response = await api.get(`/reports/cost-breakdown?period=${period}`);
        return response;
    },

    // Get goal progress
    getGoalProgress: async (period = 'monthly') => {
        const response = await api.get(`/reports/goal-progress?period=${period}`);
        return response;
    },

    // Get peak hours analysis
    getPeakHours: async (period = 'weekly') => {
        const response = await api.get(`/reports/peak-hours?period=${period}`);
        return response;
    },

    // Get device efficiency report
    getDeviceEfficiency: async (period = 'monthly') => {
        const response = await api.get(`/reports/device-efficiency?period=${period}`);
        return response;
    },

    // Get automation impact
    getAutomationImpact: async (period = 'monthly') => {
        const response = await api.get(`/reports/automation-impact?period=${period}`);
        return response;
    },

    // Get forecast
    getForecast: async () => {
        const response = await api.get('/reports/forecast');
        return response;
    },

    // Get carbon impact
    getCarbonImpact: async (period = 'monthly') => {
        const response = await api.get(`/reports/carbon-impact?period=${period}`);
        return response;
    },

    // Get insights and recommendations
    getInsights: async (period = 'weekly') => {
        const response = await api.get(`/reports/insights?period=${period}`);
        return response;
    },

    // What-if simulation
    simulateWhatIf: async (deviceId, reductionHours, period = 'monthly') => {
        const response = await api.post('/reports/what-if', {
            deviceId,
            reductionHours,
            period
        });
        return response;
    }
};

export default reportService;
