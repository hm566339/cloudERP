import React from 'react';
import PropTypes from 'prop-types';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Universal "Not Available Yet" placeholder component for resources or features
 * that are marked MISSING or pending in backend microservices.
 * Prevents firing failing 404/500 network requests.
 */
export default function NotAvailableYet({
  title = 'Feature Under Development',
  description = 'This backend service endpoint is currently scheduled for an upcoming release and is not yet available.',
  moduleName,
  backPath,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
        <Construction className="w-7 h-7" />
      </div>

      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {moduleName && (
        <span className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          Module: {moduleName}
        </span>
      )}

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {backPath && (
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      )}
    </div>
  );
}

NotAvailableYet.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  moduleName: PropTypes.string,
  backPath: PropTypes.string,
};
