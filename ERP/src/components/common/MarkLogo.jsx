import React, { useState } from 'react';

/**
 * MarkLogo Component
 * Renders the official MARK2 SVG logo with environment-aware base path resolution
 * and an inline SVG brand fallback if asset loading fails.
 *
 * @param {'light' | 'dark'} variant - 'light' for light backgrounds, 'dark' for dark backgrounds (white wordmark).
 * @param {string} className - CSS styling classes for width, height, object-fit.
 * @param {string} alt - Alt text (default: 'Mark2 Logo').
 */
export default function MarkLogo({
  variant = 'light',
  className = 'h-9 w-auto object-contain',
  alt = 'Mark2 Logo',
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  const basePath = import.meta.env.BASE_URL || '/';
  const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const logoFile = variant === 'dark' ? 'MARK2_transparent_logo.svg' : 'MARK2_logo.svg';
  const logoSrc = `${cleanBase}${logoFile}`;

  if (hasError) {
    return (
      <div className={`inline-flex items-center gap-2 font-display font-extrabold select-none ${className}`} {...props}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
          M2
        </div>
        <span className={`text-base tracking-tight font-black ${variant === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          MARK<span className="text-sky-500">2</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="eager"
      {...props}
    />
  );
}
