import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy standalone ERP Login page has been deprecated and completely removed.
 * All authentication entry flows now use the canonical ERP landing page at /erp/.
 */
export default function Login() {
  return <Navigate to="/" replace />;
}
