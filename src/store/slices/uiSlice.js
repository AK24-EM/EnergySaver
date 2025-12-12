import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  theme: 'light',
  notifications: true,
  loading: {
    devices: false,
    usage: false,
    reports: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setLoading: (state, action) => {
      const { section, loading } = action.payload;
      state.loading[section] = loading;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarOpen, 
  setTheme, 
  setNotifications, 
  setLoading 
} = uiSlice.actions;
export default uiSlice.reducer;