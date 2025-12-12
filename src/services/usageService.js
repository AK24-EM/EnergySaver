import api from './api';

const usageService = {
  getRealTimeUsage: async () => {
    return await api.get('/usage/realtime');
  },

  getUsageHistory: async (period = '24h', deviceId = null) => {
    const params = { period };
    if (deviceId) params.deviceId = deviceId;
    return await api.get('/usage/history', { params });
  },

  getUsageSummary: async () => {
    return await api.get('/usage/summary');
  },
};

export default usageService;