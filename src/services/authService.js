import api from './api';

const authService = {
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};

export default authService;