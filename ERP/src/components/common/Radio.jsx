import React from 'react';

/**
 * Standard Radio component.
 * Follows ERP design tokens: zinc palette, crisp dot indicator, accessibility.
 *
 * @param {Object} props
 * @param {boolean} [props.checked=false]
 * @param {string | React.ReactNode} [props.label]
 * @param {string} [props.description]
 * @param {string} [props.className]
 */
const Radio = React.forwardRef(function Radio(
  {
    checked = false,
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
  const generatedId = id || (label ? `radio-${String(label).replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={generatedId}
      className={`inline-flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          ref={ref}
          id={generatedId}
          type="radio"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] transition-all duration-150 peer-checked:border-zinc-900 dark:peer-checked:border-[#4C8DFF] peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/15 dark:peer-focus-visible:ring-[#4C8DFF]/30 flex items-center justify-center shadow-2xs">
          {checked && <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-[#4C8DFF]" />}
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

Radio.displayName = 'Radio';

export default Radio;
