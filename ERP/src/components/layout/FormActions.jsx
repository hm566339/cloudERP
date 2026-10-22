import React from 'react';

/**
 * FormActions provides an aligned footer container for form action buttons
 * (e.g. Cancel, Save, Submit, Reset).
 *
 * Spacing Specs:
 * - Margin Top: mt-6
 * - Padding Top: pt-4
 * - Border: border-t border-zinc-200
 * - Button Gap: gap-3 (12px)
 * - Alignment: justify-end (or justify-between when left slot provided)
 */
export default function FormActions({
  children,
  leftContent,
  className = '',
  border = true,
  ...props
}) {
  return (
    <div
      className={`mt-6 pt-4 ${
        border ? 'border-t border-zinc-200 dark:border-[#2A2F3D]' : ''
      } flex items-center ${
        leftContent ? 'justify-between' : 'justify-end'
      } gap-3 ${className}`}
      {...props}
    >
      {leftContent && (
        <div className="flex items-center gap-2">
          {leftContent}
        </div>
      )}
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
}
