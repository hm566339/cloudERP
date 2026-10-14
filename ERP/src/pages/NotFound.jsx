import React from 'react';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import { getPostLoginRedirectPath } from '../utils/moduleAccess';
import { PATHS } from '../routes/paths';

export default function NotFound() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  const handleHomeNavigation = () => {
    if (isAuthenticated && currentUser) {
      const destination = getPostLoginRedirectPath({ user: currentUser });
      navigate(destination, { replace: true });
    } else {
      navigate(PATHS.LANDING, { replace: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-8 leading-relaxed text-sm">
          The requested page could not be found or may have been moved.
          Please check the URL or return to your dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </button>
          <button
            type="button"
            onClick={handleHomeNavigation}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium text-white transition-colors flex items-center text-sm shadow-sm"
          >
            <Home size={16} className="mr-2" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
