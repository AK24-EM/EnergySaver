import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import deviceReducer from './slices/deviceSlice';
import usageReducer from './slices/usageSlice';
import alertReducer from './slices/alertSlice';
import uiReducer from './slices/uiSlice';
import insightsReducer from './slices/insightsSlice';
import automationReducer from './slices/automationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    devices: deviceReducer,
    usage: usageReducer,
    alerts: alertReducer,
    ui: uiReducer,
    insights: insightsReducer,
    automation: automationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});