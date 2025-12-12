import api from './api';

const alertService = {
  getAlerts: async () => {
    return await api.get('/alerts');
  },

  acknowledgeAlert: async (alertId) => {
    return await api.put(`/alerts/${alertId}/acknowledge`);
  },

  dismissAlert: async (alertId) => {
    return await api.delete(`/alerts/${alertId}`);
  },
};

export default alertService;