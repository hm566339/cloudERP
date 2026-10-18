import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ModuleSelection is deprecated.
 * Redirects directly to canonical /login route.
 */
export default function ModuleSelection() {
  return <Navigate to="/" replace />;
}

