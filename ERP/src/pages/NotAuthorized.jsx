import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h1>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          You do not have the required permissions to view this page or perform this action. 
          If you believe this is a mistake, please contact your system administrator.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg border border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft size={16} className="inline mr-2" />
            Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg bg-zinc-900 font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
