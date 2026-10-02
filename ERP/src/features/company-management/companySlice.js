import { createSlice } from '@reduxjs/toolkit'

let selectedCompany = null
try {
 const savedCompany = localStorage.getItem('selected_company')
 if (savedCompany) {
 selectedCompany = JSON.parse(savedCompany)
 }
} catch (e) {
 console.error('Failed to parse selected company', e)
}

const companySlice = createSlice({
 name: 'company',
 initialState: {
 selectedCompany,
 companyList: [],
 },
 reducers: {
 setSelectedCompany: (state, action) => {
 state.selectedCompany = action.payload
 if (action.payload) {
 localStorage.setItem('selected_company', JSON.stringify(action.payload))
 } else {
 localStorage.removeItem('selected_company')
 }
 },
 setCompanyList: (state, action) => {
 state.companyList = action.payload
 },
 clearSelectedCompany: (state) => {
 state.selectedCompany = null
 localStorage.removeItem('selected_company')
 },
 },
})

export const { setSelectedCompany, setCompanyList, clearSelectedCompany } = companySlice.actions
export default companySlice.reducer
export const selectSelectedCompany = (state) => state.company.selectedCompany
export const selectCompanyList = (state) => state.company.companyList
