import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
 name: 'notification',
 initialState: {
 alerts: [], // [{ id, type: 'success'|'error'|'info'|'warning', message }]
 },
 reducers: {
 addAlert: (state, action) => {
 if (!action.payload?.message) return;
 const message = String(action.payload.message).trim();
 const type = action.payload.type || 'info';

 // Prevent duplicate rapid alerts
 const existing = state.alerts.find(
 (a) => a.type === type && (a.message?.trim() === message)
 );
 if (existing) return;

 // Use a random suffix to prevent ID collisions if called in the same millisecond
 const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
 state.alerts.push({
 id,
 type,
 message,
 })
 },
 removeAlert: (state, action) => {
 state.alerts = state.alerts.filter((alert) => alert.id !== action.payload)
 },
 clearAllAlerts: (state) => {
 state.alerts = []
 },
 },
})

export const { addAlert, removeAlert, clearAllAlerts } = notificationSlice.actions
export default notificationSlice.reducer
