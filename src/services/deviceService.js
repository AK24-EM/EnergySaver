import api from './api';

const deviceService = {
  getDevices: async () => {
    return await api.get('/devices');
  },

  getTemplates: async () => {
    return await api.get('/devices/templates');
  },

  addDevice: async (deviceData) => {
    return await api.post('/devices', deviceData);
  },

  updateDevice: async (deviceId, data) => {
    return await api.put(`/devices/${deviceId}`, data);
  },

  deleteDevice: async (deviceId) => {
    return await api.delete(`/devices/${deviceId}`);
  },

  getDeviceStats: async (deviceId) => {
    return await api.get(`/devices/${deviceId}/stats`);
  },

  updateAutomation: async (deviceId, type, settings, enabled) => {
    return await api.post(`/devices/${deviceId}/automation`, { type, settings, enabled });
  },

  optimizeDevices: async (type) => {
    return await api.post('/devices/optimization', { type });
  },
};

export default deviceService;