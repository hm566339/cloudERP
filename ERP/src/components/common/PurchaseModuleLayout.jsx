import React from 'react';
import { Outlet } from 'react-router-dom';
import { PurchaseNavigationContext } from './PurchaseNavigation';

export default function PurchaseModuleLayout() {
  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <PurchaseNavigationContext.Provider value={true}>
        <Outlet />
      </PurchaseNavigationContext.Provider>
    </div>
  );
}