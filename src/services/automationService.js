import api from './api';

const automationService = {
    // Rules
    getRules: async () => {
        return await api.get('/automation/rules');
    },

    createRule: async (ruleData) => {
        return await api.post('/automation/rules', ruleData);
    },

    updateRule: async (ruleId, ruleData) => {
        return await api.put(`/automation/rules/${ruleId}`, ruleData);
    },

    deleteRule: async (ruleId) => {
        return await api.delete(`/automation/rules/${ruleId}`);
    },

    // Modes
    getModes: async () => {
        return await api.get('/automation/modes');
    },

    activateMode: async (mode) => {
        return await api.post(`/automation/modes/${mode}`);
    },

    // Actions
    pauseAutomation: async (duration) => {
        return await api.post('/automation/pause', { duration });
    },

    undoAction: async (actionId) => {
        return await api.post(`/automation/undo/${actionId}`);
    },

    // Logs
    getLogs: async (limit = 50) => {
        return await api.get(`/automation/logs?limit=${limit}`);
    },

    // Status
    getStatus: async () => {
        return await api.get('/automation/status');
    }
};

export default automationService;
