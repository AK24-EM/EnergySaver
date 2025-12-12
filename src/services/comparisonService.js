import api from './api';

const comparisonService = {
    // Get household profile
    getProfile: async () => {
        const response = await api.get('/comparison/profile');
        return response;
    },

    // Update household profile
    updateProfile: async (profileData) => {
        const response = await api.put('/comparison/profile', profileData);
        return response;
    },

    // Get comparison insights
    getInsights: async () => {
        const response = await api.get('/comparison/insights');
        return response;
    }
};

export default comparisonService;
