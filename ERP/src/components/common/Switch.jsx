import React from 'react';

/**
 * Standard Switch / Toggle component.
 * Follows ERP design tokens: zinc palette, smooth sliding transition, accessibility.
 *
 * @param {Object} props
 * @param {boolean} [props.checked=false]
 * @param {function} [props.onChange]
 * @param {string | React.ReactNode} [props.label]
 * @param {string} [props.description]
 * @param {boolean} [props.disabled=false]
 * @param {'sm' | 'md'} [props.size='md']
 * @param {string} [props.className]
 */
const Switch = React.forwardRef(function Switch(
  {
    checked = false,
    onChange,
    label,
    description,
    disabled = false,
    size = 'md',
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = id || (label ? `switch-${String(label).replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const trackSizes = {
    sm: 'w-7 h-4',
    md: 'w-9 h-5',
  };

  const thumbSizes = {
    sm: 'w-3 h-3 translate-x-0.5 peer-checked:translate-x-3.5',
    md: 'w-3.5 h-3.5 translate-x-0.5 peer-checked:translate-x-4.5',
  };

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e.target.checked, e);
    }
  };

  return (
    <label
      htmlFor={generatedId}
      className={`inline-flex items-start gap-2.5 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center mt-0.5">
        <input
          ref={ref}
          id={generatedId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`${
            trackSizes[size] || trackSizes.md
          } bg-zinc-200 dark:bg-[#2A2F3D] peer-checked:bg-zinc-900 dark:peer-checked:bg-[#4C8DFF] rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/15 dark:peer-focus-visible:ring-[#4C8DFF]/30 flex items-center`}
        >
          <div
            className={`${
              thumbSizes[size] || thumbSizes.md
            } bg-white dark:bg-[#E6E8EE] rounded-full transition-transform duration-200 shadow-xs`}
          />
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

Switch.displayName = 'Switch';

export default Switch;
