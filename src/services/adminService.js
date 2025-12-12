import api from './api';

const adminService = {
    getStats: async () => {
        const response = await api.get('/admin/overview');
        return response.data;
    },

    getAnalytics: async (period) => {
        const response = await api.get(`/admin/analytics?period=${period}`);
        return response.data;
    },

    // Template Management
    getTemplates: async () => {
        const response = await api.get('/admin/templates');
        return response.data;
    },

    createTemplate: async (data) => {
        const response = await api.post('/admin/templates', data);
        return response.data;
    },

    updateTemplate: async (id, data) => {
        const response = await api.put(`/admin/templates/${id}`, data);
        return response.data;
    },

    deleteTemplate: async (id) => {
        const response = await api.delete(`/admin/templates/${id}`);
        return response.data;
    }
};

export default adminService;
