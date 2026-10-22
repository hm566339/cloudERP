import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-[#0F1117] p-6">
      <div className="bg-white dark:bg-[#161922] p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-[#F0616D]/15 text-rose-500 dark:text-[#F0616D] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] mb-2">Access Denied</h1>
        <p className="text-zinc-500 dark:text-[#A0A6B5] mb-8 leading-relaxed">
          You do not have the required permissions to view this page or perform this action. 
          If you believe this is a mistake, please contact your system administrator.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] font-medium text-zinc-700 dark:text-[#E6E8EE] hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors"
          >
            <ArrowLeft size={16} className="inline mr-2" />
            Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg bg-zinc-900 font-medium text-white hover:bg-zinc-800 dark:bg-[#4C8DFF] dark:hover:bg-[#6AA1FF] transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
