import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../../api/common/client.js'

export const fetchAccountCompanies = createAsyncThunk(
  'accountCompany/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/account/companies')
      const companies = response?.data?.data?.company ?? []
      let selected = companies[0] || null

      try {
        const savedStr = typeof localStorage !== 'undefined' ? localStorage.getItem('selected_company') : null
        if (savedStr) {
          const parsed = JSON.parse(savedStr)
          const savedId = String(parsed?.id || parsed?.companyId || parsed?.code || '')
          if (savedId) {
            const found = companies.find(
              (c) => String(c.id || c._id || c.companyId || c.companyCode) === savedId
            )
            if (found) selected = found
          }
        }
      } catch (e) {
        // Fallback to first company
      }

      return { companies, selectedCompany: selected }
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
    setAccountSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload
    },
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

export const { setAccountSelectedCompany, clearAccountCompany } = accountCompanySlice.actions

export const selectAccountCompany = (state) => state.accountCompany
export const selectAccountCompanies = (state) => state.accountCompany.companies
export const selectAccountSelectedCompany = (state) => state.accountCompany.selectedCompany
export const selectAccountCompanyLoading = (state) => state.accountCompany.loading

export default accountCompanySlice.reducer
