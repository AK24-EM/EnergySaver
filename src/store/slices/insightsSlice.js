import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import insightsService from '../../services/insightsService';

export const fetchTrends = createAsyncThunk(
    'insights/fetchTrends',
    async (_, { rejectWithValue }) => {
        try {
            const response = await insightsService.getTrends();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch trends');
        }
    }
);

export const fetchGoals = createAsyncThunk(
    'insights/fetchGoals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await insightsService.getGoals();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch goals');
        }
    }
);

const insightsSlice = createSlice({
    name: 'insights',
    initialState: {
        trends: null,
        goals: null,
        isLoading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch trends
            .addCase(fetchTrends.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTrends.fulfilled, (state, action) => {
                state.isLoading = false;
                state.trends = action.payload;
            })
            .addCase(fetchTrends.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch goals
            .addCase(fetchGoals.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchGoals.fulfilled, (state, action) => {
                state.isLoading = false;
                state.goals = action.payload;
            })
            .addCase(fetchGoals.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export default insightsSlice.reducer;
