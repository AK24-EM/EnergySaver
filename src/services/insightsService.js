import api from './api';

const insightsService = {
    getTrends: async () => {
        const response = await api.get('/insights/trends');
        return response;
    },

    getGoals: async () => {
        const response = await api.get('/insights/goals');
        return response;
    }
};

export default insightsService;
