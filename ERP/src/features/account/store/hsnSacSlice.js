import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import accountHttpClient from '../../../api/common/client';

/**
 * Async Thunk to fetch HSN/SAC Master list from backend API
 * GET /api/account/hsn-sac
 */
export const fetchHsnSacs = createAsyncThunk(
  'hsnSac/fetchHsnSacs',
  async ({ companyId, searchKey = '', page = 0, size = 10 } = {}, { getState, rejectWithValue }) => {
    try {
      const { hsnSac } = getState();
      // Optimization: Do not refetch if data is already loaded in Redux AND we are not searching
      if (hsnSac.isLoaded && hsnSac.items.length > 0 && !searchKey && page === 0) {
        return hsnSac.items;
      }

      const params = {};
      if (companyId) params.companyId = companyId;
      if (searchKey) params.searchKey = searchKey;
      params.page = page;
      params.size = size;

      const response = await accountHttpClient.get('/api/account/hsn-sac', { params });

      const responseData = response.data;

      // Extract list from response payload formats:
      // { success: true, data: { hsnSacMasters: [...] } }, { content: [...] }, or raw array
      const rawList = 
        responseData?.data?.hsnSacMasters || 
        responseData?.hsnSacMasters || 
        responseData?.data?.content ||
        responseData?.data || 
        responseData?.content || 
        (Array.isArray(responseData) ? responseData : []);

      return Array.isArray(rawList) ? rawList : [];
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to fetch HSN/SAC records';
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

const hsnSacSlice = createSlice({
  name: 'hsnSac',
  initialState,
  reducers: {
    clearHsnSacCache: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.isLoaded = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHsnSacs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHsnSacs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.isLoaded = true;
        state.error = null;
      })
      .addCase(fetchHsnSacs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHsnSacCache } = hsnSacSlice.actions;

// Selectors
export const selectHsnSacItems = (state) => state.hsnSac?.items || [];
export const selectHsnSacLoading = (state) => state.hsnSac?.loading || false;
export const selectHsnSacError = (state) => state.hsnSac?.error || null;
export const selectHsnSacIsLoaded = (state) => state.hsnSac?.isLoaded || false;

export default hsnSacSlice.reducer;
