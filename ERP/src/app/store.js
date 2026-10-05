import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'

const createWebStorage = () => {
  return {
    getItem: (key) => {
      return new Promise((resolve) => {
        resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null);
      });
    },
    setItem: (key, value) => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        resolve(value);
      });
    },
    removeItem: (key) => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        resolve();
      });
    },
  };
};

const storage = createWebStorage();

import { baseApi } from '../api/common/baseApi'

import companyReducer from '../features/company-management/companySlice'
import accountCompanyReducer from '../features/account/store/accountCompanySlice'
import themeReducer from '../features/theme/themeSlice'
import notificationReducer from '../features/notifications/notificationSlice'
import hydrationReducer from '../features/hydration/hydrationSlice'
import authReducer from '../features/auth/authSlice'
import hsnSacReducer from '../features/account/store/hsnSacSlice'
import gstSlabReducer from '../features/account/store/gstSlabSlice'
import { rtkQueryErrorLogger } from './errorMiddleware'

const appReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  company: companyReducer,
  accountCompany: accountCompanyReducer,
  theme: themeReducer,
  notification: notificationReducer,
  hydration: hydrationReducer,
  hsnSac: hsnSacReducer,
  gstSlab: gstSlabReducer,
})

// Define a root reducer to support resetting the entire store on logout
const rootReducer = (state, action) => {
  if (action.type === 'RESET_STORE' || action.type === 'auth/logout') {
    state = {
      ...state,
      auth: {
        user: null,
        permissions: [],
        sessionStatus: 'unauthenticated',
      },
      company: {
        selectedCompany: null,
        companyList: [],
      },
      theme: state?.theme,
      hydration: state?.hydration,
    }
  }
  return appReducer(state, action)
}

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['company', 'theme', 'auth'], // Persist UI, company state, and auth tokens
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, rtkQueryErrorLogger),
})

export const persistor = persistStore(store)
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}
export const resetStore = () => ({ type: 'RESET_STORE' })
export const logout = () => ({ type: 'auth/logout' })
export default store
