import api from './api';

/**
 * Settings Service - API calls for all settings endpoints
 */

export const settingsService = {
    // ==========================================
    // HOME PROFILE
    // ==========================================

    // Get home profile
    getHomeProfile: async () => {
        const response = await api.get('/settings/home');
        return response;
    },

    // Update home profile
    updateHomeProfile: async (data) => {
        const response = await api.put('/settings/home', data);
        return response;
    },

    // ==========================================
    // TARIFF & BILLING
    // ==========================================

    // Get tariff settings
    getTariffSettings: async () => {
        const response = await api.get('/settings/tariff');
        return response;
    },

    // Update tariff settings
    updateTariffSettings: async (data) => {
        const response = await api.put('/settings/tariff', data);
        return response;
    },

    // ==========================================
    // ROOMS & ZONES
    // ==========================================

    // Get all rooms
    getRooms: async () => {
        const response = await api.get('/settings/rooms');
        return response;
    },

    // Add a room
    addRoom: async (data) => {
        const response = await api.post('/settings/rooms', data);
        return response;
    },

    // Update a room
    updateRoom: async (id, data) => {
        const response = await api.put(`/settings/rooms/${id}`, data);
        return response;
    },

    // Delete a room
    deleteRoom: async (id) => {
        const response = await api.delete(`/settings/rooms/${id}`);
        return response;
    },

    // ==========================================
    // MEMBERS & PERMISSIONS
    // ==========================================

    // Get all members
    getMembers: async () => {
        const response = await api.get('/settings/members');
        return response;
    },

    // Invite a member
    inviteMember: async (data) => {
        const response = await api.post('/settings/members/invite', data);
        return response;
    },

    // Update member role/permissions
    updateMember: async (id, data) => {
        const response = await api.put(`/settings/members/${id}`, data);
        return response;
    },

    // Remove a member
    removeMember: async (id) => {
        const response = await api.delete(`/settings/members/${id}`);
        return response;
    },

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    // Get notification preferences
    getNotifications: async () => {
        const response = await api.get('/settings/notifications');
        return response;
    },

    // Update notification preferences
    updateNotifications: async (data) => {
        const response = await api.put('/settings/notifications', data);
        return response;
    },

    // Subscribe to push notifications
    subscribeToPush: async (subscription) => {
        const response = await api.post('/settings/notifications/subscribe', subscription);
        return response;
    },

    // Get VAPID public key
    getVapidKey: async () => {
        const response = await api.get('/settings/vapid-key');
        return response.publicKey;
    }
};

export default settingsService;
