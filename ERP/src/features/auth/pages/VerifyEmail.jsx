import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailCheck, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyEmailToken } from '../../../api/sso/user';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function VerifyEmail() {
  const { buildPath } = useRoutePath();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (token) {
      verifyEmailToken(token)
        .then(() => {
          setIsSuccess(true);
        })
        .catch((err) => {
          setIsError(true);
          setError(err?.response?.data || err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setIsError(true);
    }
  }, [token]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
      {(isLoading || (!token && !isError)) && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-6 shadow-inner">
            <Loader2 size={32} className="text-zinc-900 animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">Verifying Email</h2>
          <p className="text-zinc-500 font-medium text-sm">Verifying your email address...</p>
        </>
      )}

      {isSuccess && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-6 shadow-lg shadow-zinc-900/20">
            <MailCheck size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">Email Verified</h2>
          <p className="text-zinc-500 font-medium text-sm mb-8">Your email has been successfully verified! You can now log into your account.</p>
          <Link
            to={buildPath('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Continue to ERP
            <ArrowRight size={16} />
          </Link>
        </>
      )}

      {(isError || !token) && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-dark border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-50 opacity-50"></div>
            <XCircle size={32} className="relative z-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">Verification Failed</h2>
          <p className="text-zinc-500 font-medium text-sm mb-8">
            {!token ? 'Invalid or missing verification token.' : (error?.message || 'Verification failed. The token may be expired or invalid.')}
          </p>
          <Link
            to={buildPath('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm active:scale-[0.98]"
          >
            Back to ERP
          </Link>
        </>
      )}
    </div>
  );
}
