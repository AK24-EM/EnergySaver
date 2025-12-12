import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import automationService from '../../services/automationService';

export const fetchRules = createAsyncThunk(
    'automation/fetchRules',
    async (_, { rejectWithValue }) => {
        try {
            return await automationService.getRules();
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch rules');
        }
    }
);

export const createRule = createAsyncThunk(
    'automation/createRule',
    async (ruleData, { rejectWithValue }) => {
        try {
            return await automationService.createRule(ruleData);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create rule');
        }
    }
);

export const deleteRule = createAsyncThunk(
    'automation/deleteRule',
    async (ruleId, { rejectWithValue }) => {
        try {
            await automationService.deleteRule(ruleId);
            return ruleId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete rule');
        }
    }
);

export const fetchModes = createAsyncThunk(
    'automation/fetchModes',
    async (_, { rejectWithValue }) => {
        try {
            return await automationService.getModes();
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch modes');
        }
    }
);

export const activateMode = createAsyncThunk(
    'automation/activateMode',
    async (mode, { rejectWithValue }) => {
        try {
            return await automationService.activateMode(mode);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to activate mode');
        }
    }
);

export const fetchLogs = createAsyncThunk(
    'automation/fetchLogs',
    async (limit, { rejectWithValue }) => {
        try {
            return await automationService.getLogs(limit);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch logs');
        }
    }
);

export const undoAction = createAsyncThunk(
    'automation/undoAction',
    async (actionId, { rejectWithValue }) => {
        try {
            return await automationService.undoAction(actionId);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to undo action');
        }
    }
);

const automationSlice = createSlice({
    name: 'automation',
    initialState: {
        rules: [],
        modes: [],
        logs: [],
        status: null,
        isLoading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch rules
            .addCase(fetchRules.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchRules.fulfilled, (state, action) => {
                state.isLoading = false;
                state.rules = action.payload?.rules || action.payload || [];
            })
            .addCase(fetchRules.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Create rule
            .addCase(createRule.fulfilled, (state, action) => {
                state.rules.push(action.payload?.rule || action.payload);
            })
            // Delete rule
            .addCase(deleteRule.fulfilled, (state, action) => {
                state.rules = state.rules.filter(r => r._id !== action.payload);
            })
            // Fetch modes
            .addCase(fetchModes.fulfilled, (state, action) => {
                state.modes = action.payload?.modes || action.payload || [];
            })
            // Fetch logs
            .addCase(fetchLogs.fulfilled, (state, action) => {
                state.logs = action.payload?.logs || action.payload || [];
            });
    }
});

export default automationSlice.reducer;
