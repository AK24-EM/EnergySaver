import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import deviceService from '../../services/deviceService';

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await deviceService.getDevices();
      return response.devices;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch devices');
    }
  }
);

export const addDevice = createAsyncThunk(
  'devices/addDevice',
  async (deviceData, { rejectWithValue }) => {
    try {
      const response = await deviceService.addDevice(deviceData);
      return response.device;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add device');
    }
  }
);

export const updateDevice = createAsyncThunk(
  'devices/updateDevice',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await deviceService.updateDevice(id, data);
      return response.device;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update device');
    }
  }
);

export const deleteDevice = createAsyncThunk(
  'devices/deleteDevice',
  async (deviceId, { rejectWithValue }) => {
    try {
      await deviceService.deleteDevice(deviceId);
      return deviceId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete device');
    }
  }
);

export const turnOffIdleDevices = createAsyncThunk(
  'devices/turnOffIdleDevices',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await deviceService.optimizeDevices('turnOffIdle');
      // Refresh devices to reflect changes
      dispatch(fetchDevices());
      return response.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to turn off idle devices');
    }
  }
);

export const fetchDeviceStats = createAsyncThunk(
  'devices/fetchDeviceStats',
  async (deviceId, { rejectWithValue }) => {
    try {
      const response = await deviceService.getDeviceStats(deviceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch device stats');
    }
  }
);

const initialState = {
  devices: [],
  selectedDevice: null,
  deviceStats: null, // Store stats for the selected device
  isLoading: false,
  isStatsLoading: false,
  error: null,
  realTimeData: {},
};

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    updateRealTimeData: (state, action) => {
      const { deviceId, ...data } = action.payload;
      state.realTimeData[deviceId] = data;

      // Update device in list if exists
      const deviceIndex = state.devices.findIndex(d => d._id === deviceId);
      if (deviceIndex !== -1) {
        state.devices[deviceIndex].status = {
          ...state.devices[deviceIndex].status,
          currentPower: data.currentPower,
          isActive: data.isActive,
          lastUpdated: data.timestamp
        };
      }
    },
    selectDevice: (state, action) => {
      state.selectedDevice = action.payload;
      state.deviceStats = null; // Clear stats when selecting new device
    },
    clearError: (state) => {
      state.error = null;
    },
    clearDeviceStats: (state) => {
      state.deviceStats = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch devices
      .addCase(fetchDevices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices = action.payload;
        state.error = null;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add device
      .addCase(addDevice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDevice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.devices.push(action.payload);
        state.error = null;
      })
      .addCase(addDevice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update device
      .addCase(updateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
      })
      // Delete device
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.devices = state.devices.filter(d => d._id !== action.payload);
        if (state.selectedDevice?._id === action.payload) {
          state.selectedDevice = null;
        }
      })
      // Fetch Device Stats
      .addCase(fetchDeviceStats.pending, (state) => {
        state.isStatsLoading = true;
        state.error = null;
      })
      .addCase(fetchDeviceStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.deviceStats = action.payload.stats;
      })
      .addCase(fetchDeviceStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { updateRealTimeData, selectDevice, clearError, clearDeviceStats } = deviceSlice.actions;
export default deviceSlice.reducer;