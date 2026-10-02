import { createSlice } from '@reduxjs/toolkit'

const initialDark = localStorage.getItem('theme_dark') === 'true'

// Sync with DOM initially
if (initialDark) {
 document.documentElement.classList.add('dark')
} else {
 document.documentElement.classList.remove('dark')
}

const themeSlice = createSlice({
 name: 'theme',
 initialState: {
 darkMode: initialDark,
 },
 reducers: {
 toggleDarkMode: (state) => {
 state.darkMode = !state.darkMode
 localStorage.setItem('theme_dark', state.darkMode.toString())
 if (state.darkMode) {
 document.documentElement.classList.add('dark')
 } else {
 document.documentElement.classList.remove('dark')
 }
 },
 setDarkMode: (state, action) => {
 state.darkMode = action.payload
 localStorage.setItem('theme_dark', state.darkMode.toString())
 if (state.darkMode) {
 document.documentElement.classList.add('dark')
 } else {
 document.documentElement.classList.remove('dark')
 }
 },
 },
})

export const { toggleDarkMode, setDarkMode } = themeSlice.actions
export default themeSlice.reducer
