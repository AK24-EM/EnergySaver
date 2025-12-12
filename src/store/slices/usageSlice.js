import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import usageService from '../../services/usageService';

// Async thunks
export const fetchRealTimeUsage = createAsyncThunk(
  'usage/fetchRealTimeUsage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usageService.getRealTimeUsage();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch real-time usage');
    }
  }
);

export const fetchUsageHistory = createAsyncThunk(
  'usage/fetchUsageHistory',
  async ({ period, deviceId }, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching usage history with period:', period, 'deviceId:', deviceId);
      const response = await usageService.getUsageHistory(period, deviceId);
      console.log('✅ Usage history response:', response);
      return response;
    } catch (error) {
      console.error('❌ Usage history error:', error);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch usage history');
    }
  }
);

export const fetchUsageSummary = createAsyncThunk(
  'usage/fetchUsageSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usageService.getUsageSummary();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch usage summary');
    }
  }
);

const initialState = {
  realTimeData: null,
  historyData: [],
  summary: null,
  isLoading: false,
  error: null,
  selectedPeriod: '24h',
  selectedDevice: null,
};

const usageSlice = createSlice({
  name: 'usage',
  initialState,
  reducers: {
    setSelectedPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    setSelectedDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    updateRealTimeUsage: (state, action) => {
      if (state.realTimeData) {
        const deviceIndex = state.realTimeData.devices.findIndex(
          d => d.deviceId === action.payload.deviceId
        );
        if (deviceIndex !== -1) {
          state.realTimeData.devices[deviceIndex] = {
            ...state.realTimeData.devices[deviceIndex],
            ...action.payload
          };

          // Recalculate totals
          const totalPower = state.realTimeData.devices.reduce(
            (sum, device) => sum + device.currentPower, 0
          );
          const totalCost = state.realTimeData.devices.reduce(
            (sum, device) => sum + device.estimatedHourlyCost, 0
          );

          state.realTimeData.totals = {
            power: totalPower,
            estimatedHourlyCost: totalCost,
            estimatedDailyCost: totalCost * 24,
            estimatedMonthlyCost: totalCost * 24 * 30
          };
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch real-time usage
      .addCase(fetchRealTimeUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRealTimeUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.realTimeData = action.payload;
        state.error = null;
      })
      .addCase(fetchRealTimeUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch usage history
      .addCase(fetchUsageHistory.fulfilled, (state, action) => {
        console.log('📦 Redux: Setting historyData to:', action.payload.usageData);
        state.historyData = action.payload.usageData;
      })
      // Fetch usage summary
      .addCase(fetchUsageSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const {
  setSelectedPeriod,
  setSelectedDevice,
  updateRealTimeUsage,
  clearError
} = usageSlice.actions;
export default usageSlice.reducer;