import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import alertService from '../../services/alertService';

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alertService.getAlerts();
      return response.alerts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch alerts');
    }
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'alerts/acknowledgeAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await alertService.acknowledgeAlert(alertId);
      return response.alert;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to acknowledge alert');
    }
  }
);

export const dismissAlert = createAsyncThunk(
  'alerts/dismissAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      await alertService.dismissAlert(alertId);
      return alertId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to dismiss alert');
    }
  }
);

const initialState = {
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      if (action.payload.status === 'active') {
        state.unreadCount += 1;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    markAsRead: (state, action) => {
      const alert = state.alerts.find(a => a._id === action.payload);
      if (alert && alert.status === 'active') {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.unreadCount = action.payload.filter(a => a.status === 'active').length;
        state.error = null;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Acknowledge alert
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          if (state.alerts[index].status === 'active') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.alerts[index] = action.payload;
        }
      })
      // Dismiss alert
      .addCase(dismissAlert.fulfilled, (state, action) => {
        const alertIndex = state.alerts.findIndex(a => a._id === action.payload);
        if (alertIndex !== -1) {
          if (state.alerts[alertIndex].status === 'active') {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.alerts.splice(alertIndex, 1);
        }
      });
  },
});

export const { addAlert, clearError, markAsRead } = alertSlice.actions;
export default alertSlice.reducer;