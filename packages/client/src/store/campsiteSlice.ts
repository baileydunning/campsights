import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CampsitesState } from '../types/Campsite';
import { getCampsites } from '../api/Campsites';

export const fetchCampsites = createAsyncThunk(
  'campsites/fetchCampsites',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { campsites: CampsitesState };
    if (state.campsites.campsites.length > 0) {
      return state.campsites.campsites;
    }
    try {
      const campsites = await getCampsites();
      return campsites;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch campsites');
    }
  }
);

const initialState: CampsitesState = {
  campsites: [],
  loading: false,
  error: null,
};

const campsiteSlice = createSlice({
  name: 'campsites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampsites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampsites.fulfilled, (state, action) => {
        state.loading = false;
        state.campsites = action.payload;
        state.error = null;
      })
      .addCase(fetchCampsites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export const { clearError } = campsiteSlice.actions;

export const selectCampsites = (state: { campsites: CampsitesState }) => state.campsites.campsites;
export const selectLoading = (state: { campsites: CampsitesState }) => state.campsites.loading;
export const selectError = (state: { campsites: CampsitesState }) => state.campsites.error;

export default campsiteSlice.reducer;