import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { BrowserRouter } from 'react-router-dom'
import { store, persistor } from './app/store'
import AppRoutes from './routes/AppRoutes'


import ErrorBoundary from './components/common/ErrorBoundary'
import { ConfirmDialogContainer } from './utils/confirmDialog'

export default function App() {
  const handleRehydration = () => {
    store.dispatch({ type: 'hydration/completeRehydration' })
  }

  const routerBasename = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL))
    ? (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL).replace(/\/$/, '')
    : '/erp'

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor} onBeforeLift={handleRehydration}>
          <BrowserRouter basename={routerBasename || '/erp'} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConfirmDialogContainer />
            <AppRoutes />
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  )
}
