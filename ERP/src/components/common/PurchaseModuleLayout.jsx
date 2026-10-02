import React from 'react';
import { Outlet } from 'react-router-dom';
import { PurchaseNavigationContext } from './PurchaseNavigation';

export default function PurchaseModuleLayout() {
  return (
    <div className="flex flex-col h-full">
      <PurchaseNavigationContext.Provider value={true}>
        <Outlet />
      </PurchaseNavigationContext.Provider>
    </div>
  );
}