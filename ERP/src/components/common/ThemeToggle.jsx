import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setThemeMode } from '../../features/theme/themeSlice';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * ThemeToggle — a compact icon button that opens a Light/Dark/System dropdown.
 * Place anywhere in a header/navbar.
 */
export default function ThemeToggle({ size = 'default' }) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme?.mode || 'system');
  const resolvedTheme = useAppSelector((s) => s.theme?.resolvedTheme || 'light');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Enable smooth theme transitions after initial mount (prevents FOUC)
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-transitions');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleSelect = (value) => {
    dispatch(setThemeMode(value));
    setOpen(false);
  };

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={`Theme: ${mode}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        className={`${btnSize} flex items-center justify-center rounded-xl text-zinc-500 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#222736] hover:text-zinc-700 dark:hover:text-[#E6E8EE] transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]`}
      >
        <CurrentIcon size={iconSize} className="transition-transform duration-200" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            aria-label="Select theme"
            className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-xl dark:shadow-2xl py-1.5 z-50 animate-slide-up origin-top-right"
          >
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isActive = mode === value;
              return (
                <button
                  key={value}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => handleSelect(value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors text-left ${
                    isActive
                      ? 'text-zinc-900 dark:text-[#4C8DFF] bg-zinc-100 dark:bg-[#4C8DFF]/15'
                      : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-[#4C8DFF]" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
