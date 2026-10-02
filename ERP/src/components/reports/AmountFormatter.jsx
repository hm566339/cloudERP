import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function AmountFormatter({ value }) {
  const numValue = Number(value);
  if (isNaN(numValue)) return <span>—</span>;
  return <span>{formatCurrency(numValue, 'INR')}</span>;
}
