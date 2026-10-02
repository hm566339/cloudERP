import { createSlice } from '@reduxjs/toolkit';
import { createLogger } from '../../utils/logger';

const logger = createLogger('HYDRATION');

/**
 * Hydration slice - manages Redux rehydration state from localStorage
 * Prevents race conditions by gating component rendering until rehydration completes
 */
const hydrationSlice = createSlice({
  name: 'hydration',
  initialState: {
    isRehydrating: true, // Start as true to prevent early renders
    isRehydrated: false,
    error: null,
  },
  reducers: {
    startRehydration: (state) => {
      state.isRehydrating = true;
      state.error = null;
      logger.debug('Starting Redux rehydration');
    },
    completeRehydration: (state) => {
      state.isRehydrating = false;
      state.isRehydrated = true;
      state.error = null;
      logger.info('Redux rehydration completed successfully');
    },
    rehydrationError: (state, action) => {
      state.isRehydrating = false;
      state.isRehydrated = true; // Still mark as "done" even with error
      state.error = action.payload;
      logger.error('Redux rehydration error', { error: action.payload });
    },
  },
});

export const { startRehydration, completeRehydration, rehydrationError } =
  hydrationSlice.actions;

// Selectors
export const selectIsRehydrating = (state) => state.hydration.isRehydrating;
export const selectIsRehydrated = (state) => state.hydration.isRehydrated;
export const selectRehydrationError = (state) => state.hydration.error;

export default hydrationSlice.reducer;
