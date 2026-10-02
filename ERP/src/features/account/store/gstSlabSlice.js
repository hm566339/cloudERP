import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import accountHttpClient from '../../../api/common/client';

/**
 * Async Thunk to fetch GST Slabs from backend API
 * GET /api/account/gst-slabs
 */
export const fetchGstSlabs = createAsyncThunk(
  'gstSlab/fetchGstSlabs',
  async (companyId, { getState, rejectWithValue }) => {
    try {
      const { gstSlab } = getState();
      // Optimization: Skip API call if data already exists in Redux
      if (gstSlab.isLoaded && gstSlab.items.length > 0) {
        return gstSlab.items;
      }

      const response = await accountHttpClient.get('/api/account/gst-slabs', {
        params: {
          ...(companyId ? { companyId } : {}),
          page: 0,
          size: 100
        }
      });

      const responseData = response.data;

      // Extract list safely from backend payload structure:
      // { success: true, data: { gstSlabs: [...] } }, { gstSlabs: [...] }, { content: [...] }, or raw array
      const rawList = 
        responseData?.data?.gstSlabs || 
        responseData?.gstSlabs || 
        responseData?.data?.content ||
        responseData?.data || 
        responseData?.content || 
        (Array.isArray(responseData) ? responseData : []);

      return Array.isArray(rawList) ? rawList : [];
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to fetch GST Slabs';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  isLoaded: false,
};

const gstSlabSlice = createSlice({
  name: 'gstSlab',
  initialState,
  reducers: {
    clearGstSlabCache: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.isLoaded = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGstSlabs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGstSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.isLoaded = true;
        state.error = null;
      })
      .addCase(fetchGstSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearGstSlabCache } = gstSlabSlice.actions;

// Selectors
export const selectGstSlabItems = (state) => state.gstSlab?.items || [];
export const selectGstSlabLoading = (state) => state.gstSlab?.loading || false;
export const selectGstSlabError = (state) => state.gstSlab?.error || null;
export const selectGstSlabIsLoaded = (state) => state.gstSlab?.isLoaded || false;

export default gstSlabSlice.reducer;
