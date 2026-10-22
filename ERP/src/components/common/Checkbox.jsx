import React, { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * Standard Checkbox component.
 * Follows ERP design tokens: zinc palette, crisp check indicator, accessibility.
 *
 * @param {Object} props
 * @param {boolean} [props.checked=false]
 * @param {boolean} [props.indeterminate=false]
 * @param {string | React.ReactNode} [props.label]
 * @param {string} [props.description]
 * @param {string} [props.className]
 */
const Checkbox = React.forwardRef(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    label,
    description,
    disabled = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const internalRef = useRef(null);
  const resolvedRef = ref || internalRef;

  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate, resolvedRef]);

  const generatedId = id || (label ? `cb-${String(label).replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={generatedId}
      className={`inline-flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          ref={resolvedRef}
          id={generatedId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div className="w-4 h-4 rounded border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] transition-all duration-150 peer-checked:bg-zinc-900 dark:peer-checked:bg-[#4C8DFF] peer-checked:border-zinc-900 dark:peer-checked:border-[#4C8DFF] peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/15 dark:peer-focus-visible:ring-[#4C8DFF]/30 flex items-center justify-center shadow-2xs">
          {indeterminate ? (
            <Minus size={11} className="text-white stroke-[2.5]" />
          ) : checked ? (
            <Check size={11} className="text-white stroke-[2.5]" />
          ) : null}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-medium text-zinc-900 dark:text-[#E6E8EE] leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mt-0.5 leading-snug">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
