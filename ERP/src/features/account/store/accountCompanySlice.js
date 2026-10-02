import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../../api/common/client'

export const fetchAccountCompanies = createAsyncThunk(
  'accountCompany/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/account/companies')
      const companies = response?.data?.data?.company ?? []
      return { companies, selectedCompany: companies[0] || null }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch companies')
    }
  }
)

const accountCompanySlice = createSlice({
  name: 'accountCompany',
  initialState: {
    loading: false,
    error: null,
    companies: [],
    selectedCompany: null,
  },
  reducers: {
    clearAccountCompany: (state) => {
      state.companies = []
      state.selectedCompany = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountCompanies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAccountCompanies.fulfilled, (state, action) => {
        state.loading = false
        state.companies = action.payload.companies
        state.selectedCompany = action.payload.selectedCompany
      })
      .addCase(fetchAccountCompanies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearAccountCompany } = accountCompanySlice.actions

export const selectAccountCompany = (state) => state.accountCompany
export const selectAccountCompanies = (state) => state.accountCompany.companies
export const selectAccountSelectedCompany = (state) => state.accountCompany.selectedCompany
export const selectAccountCompanyLoading = (state) => state.accountCompany.loading

export default accountCompanySlice.reducer
