import React from 'react';
import ModuleTabs, { salesTabs } from './ModuleTabs';

export default function TransactionNavigation() {
  return <ModuleTabs tabs={salesTabs} />;
}
