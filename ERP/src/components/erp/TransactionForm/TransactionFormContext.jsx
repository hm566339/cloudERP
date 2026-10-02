import React, { createContext, useContext } from 'react';

const TransactionFormContext = createContext(null);

export function TransactionFormProvider({ value, children }) {
  return <TransactionFormContext.Provider value={value}>{children}</TransactionFormContext.Provider>;
}

export function useTransactionForm() {
  const context = useContext(TransactionFormContext);
  if (!context) throw new Error('useTransactionForm must be used inside TransactionFormProvider');
  return context;
}
