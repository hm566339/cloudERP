import React from 'react';

/**
 * Reusable FormField wrapper component.
 * Standardizes label, required asterisk, optional tooltip/hint, and validation error presentation.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.label - Field label
 * @param {string} [props.htmlFor] - HTML ID for the associated input
 * @param {boolean} [props.required=false] - Whether the field is mandatory
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.hint] - Optional helper/hint text below the field
 * @param {string} [props.className] - Container CSS classes
 * @param {React.ReactNode} props.children - Input or control element
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className = '',
  children,
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="text-[11px] font-medium text-rose-500 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
