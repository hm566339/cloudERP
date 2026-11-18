import React from 'react';
import { ChevronDown } from 'lucide-react';
import CustomSelect from './CustomSelect';

/**
 * Enterprise Select component.
 * Uses CustomSelect with ERP design tokens (standard h-8 height, zinc palette, portal floating menu)
 * while maintaining backward-compatibility with native <select> props, children (<option>),
 * and synthetic change events (e.target.value / e.target.name).
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.error=false]
 * @param {Array<{value: any, label: string}>} [props.options]
 * @param {string} [props.placeholder]
 * @param {string} [props.className]
 * @param {boolean} [props.native=false]
 */
const Select = React.forwardRef(function Select(
  {
    native = false,
    size = 'md',
    error = false,
    options,
    placeholder,
    className = '',
    buttonClassName = '',
    disabled = false,
    children,
    value,
    onChange,
    name,
    searchable,
    ...props
  },
  ref
) {
  if (native) {
    const sizeClasses = {
      sm: 'h-7 pl-2.5 pr-7 text-xs',
      md: 'h-8 pl-3 pr-8 text-xs',
      lg: 'h-9 pl-3.5 pr-9 text-sm',
    };

    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{ backgroundImage: 'none', ...props.style }}
          className={`w-full appearance-none [background-image:none] bg-none bg-white dark:bg-[#1D212C] rounded-lg border font-medium text-zinc-900 dark:text-[#E6E8EE] transition-all duration-150 outline-none cursor-pointer disabled:bg-zinc-50 dark:disabled:bg-[#161922] disabled:text-zinc-400 dark:disabled:text-[#6B7184] disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 dark:border-[#F0616D] focus:border-rose-500 dark:focus:border-[#F0616D] focus:ring-2 focus:ring-rose-500/10 dark:focus:ring-[#F0616D]/20'
              : 'border-zinc-200 dark:border-[#2A2F3D] hover:border-zinc-300 dark:hover:border-[#3A4154] focus:border-zinc-400 dark:focus:border-[#4C8DFF] focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-[#4C8DFF]/20'
          } ${sizeClasses[size] || sizeClasses.md} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="dark:bg-[#1D212C] dark:text-[#6B7184]">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-[#1D212C] dark:text-[#E6E8EE]">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-[#A0A6B5] flex items-center">
          <ChevronDown size={14} />
        </div>
      </div>
    );
  }

  return (
    <CustomSelect
      ref={ref}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      size={size}
      className={className}
      buttonClassName={buttonClassName}
      searchable={searchable}
      {...props}
    >
      {children}
    </CustomSelect>
  );
});

Select.displayName = 'Select';

export default Select;
