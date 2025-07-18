import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Campsite, CampsitesState } from '../types/Campsite';
import { getCampsites, addCampsite, editCampsite, deleteCampsite as deleteCampsiteApi } from '../api/Campsites';

export const fetchCampsites = createAsyncThunk(
  'campsites/fetchCampsites',
  async (_, { rejectWithValue }) => {
    try {
      const campsites = await getCampsites();
      return campsites;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch campsites');
    }
  }
);

export const postCampsite = createAsyncThunk(
  'campsites/postCampsite',
  async (campsite: Campsite, { rejectWithValue }) => {
    try {
      const newCampsite = await addCampsite(campsite);
      return newCampsite;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add campsite');
    }
  }
);

export const putCampsite = createAsyncThunk(
  'campsites/putCampsite',
  async ({ id, data }: { id: string, data: Omit<Campsite, 'id'> }, { rejectWithValue }) => {
    try {
      const updated = await editCampsite(id, data);
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update campsite');
    }
  }
);

export const deleteCampsite = createAsyncThunk(
  'campsites/deleteCampsite',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteCampsiteApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete campsite');
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
      // Post campsite
      .addCase(postCampsite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postCampsite.fulfilled, (state, action) => {
        state.loading = false;
        state.campsites.push(action.payload);
        state.error = null;
      })
      .addCase(postCampsite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Edit campsite
      .addCase(putCampsite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(putCampsite.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.campsites.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) {
          state.campsites[idx] = action.payload;
        }
        state.error = null;
      })
      .addCase(putCampsite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete campsite
      .addCase(deleteCampsite.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCampsite.fulfilled, (state, action) => {
        state.loading = false;
        state.campsites = state.campsites.filter(c => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCampsite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = campsiteSlice.actions;

export const selectCampsites = (state: { campsites: CampsitesState }) => state.campsites.campsites;
export const selectLoading = (state: { campsites: CampsitesState }) => state.campsites.loading;
export const selectError = (state: { campsites: CampsitesState }) => state.campsites.error;

export default campsiteSlice.reducer;