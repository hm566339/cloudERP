import React from 'react';
import { Webhook, Zap, Radio, Globe } from 'lucide-react';

/**
 * Normalizes provider code to one of: FACEBOOK, INDIAMART, TRADEINDIA, CUSTOM_WEBHOOK
 */
export function normalizeProviderCode(code) {
  if (!code) return 'CUSTOM_WEBHOOK';
  const str = String(code).toUpperCase();
  if (str.includes('FACEBOOK') || str.includes('META')) return 'FACEBOOK';
  if (str.includes('INDIAMART')) return 'INDIAMART';
  if (str.includes('TRADEINDIA')) return 'TRADEINDIA';
  if (str.includes('JUSTDIAL')) return 'JUSTDIAL';
  if (str.includes('LINKEDIN')) return 'LINKEDIN_LEADS';
  if (str.includes('GOOGLE')) return 'GOOGLE_ADS';
  if (str.includes('ZAPIER')) return 'ZAPIER';
  if (str.includes('MAKE')) return 'MAKE';
  return str;
}

/**
 * Returns brand metadata including colors, display labels, and badges.
 */
export function getProviderBrandMeta(code) {
  const norm = normalizeProviderCode(code);
  switch (norm) {
    case 'FACEBOOK':
      return {
        code: 'FACEBOOK',
        name: 'Meta / Facebook Lead Ads',
        shortName: 'Facebook Ads',
        brandColor: '#1877F2',
        badgeBg: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25',
        gradient: 'from-[#0866FF] to-[#1877F2]',
      };
    case 'INDIAMART':
      return {
        code: 'INDIAMART',
        name: 'IndiaMART B2B Portal',
        shortName: 'IndiaMART',
        brandColor: '#2E3192',
        badgeBg: 'bg-[#2E3192]/10 text-[#2E3192] dark:text-[#5B63E8] border-[#2E3192]/25',
        gradient: 'from-[#2E3192] to-[#1F2368]',
      };
    case 'TRADEINDIA':
      return {
        code: 'TRADEINDIA',
        name: 'TradeIndia Marketplace',
        shortName: 'TradeIndia',
        brandColor: '#FFB800',
        badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
        gradient: 'from-[#FFB800] to-[#E69500]',
      };
    case 'JUSTDIAL':
      return {
        code: 'JUSTDIAL',
        name: 'Justdial B2B Leads',
        shortName: 'Justdial',
        brandColor: '#FF6F00',
        badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/25',
        gradient: 'from-[#FF6F00] to-[#E65100]',
      };
    case 'LINKEDIN_LEADS':
      return {
        code: 'LINKEDIN_LEADS',
        name: 'LinkedIn Lead Gen Ads',
        shortName: 'LinkedIn',
        brandColor: '#0A66C2',
        badgeBg: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/25',
        gradient: 'from-[#0A66C2] to-[#004182]',
      };
    case 'GOOGLE_ADS':
      return {
        code: 'GOOGLE_ADS',
        name: 'Google Ads Lead Form Extensions',
        shortName: 'Google Ads',
        brandColor: '#4285F4',
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
        gradient: 'from-[#4285F4] to-[#3367D6]',
      };
    case 'ZAPIER':
      return {
        code: 'ZAPIER',
        name: 'Zapier Webhook Integration',
        shortName: 'Zapier',
        brandColor: '#FF4F00',
        badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
        gradient: 'from-[#FF4F00] to-[#E03E00]',
      };
    case 'MAKE':
      return {
        code: 'MAKE',
        name: 'Make.com Scenario Ingestion',
        shortName: 'Make',
        brandColor: '#6D28D9',
        badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
        gradient: 'from-[#6D28D9] to-[#4C1D95]',
      };
    case 'CUSTOM_WEBHOOK':
    default:
      return {
        code: norm,
        name: 'Custom Generic Webhook',
        shortName: 'Generic Webhook',
        brandColor: '#10B981',
        badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
        gradient: 'from-emerald-500 to-teal-600',
      };
  }
}

/**
 * Renders authentic, crisp vector brand logos for CRM Lead Ingestion providers.
 */
export default function IntegrationProviderLogo({
  code,
  logoUrl,
  size = 'md', // 'xs' (20px), 'sm' (28px), 'md' (36px), 'lg' (44px), 'xl' (52px)
  className = '',
  showBorder = true,
}) {
  const norm = normalizeProviderCode(code);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const sizeDimensions = {
    xs: 'w-5 h-5 min-w-[20px] rounded-md text-[10px]',
    sm: 'w-7 h-7 min-w-[28px] rounded-lg text-xs',
    md: 'w-9 h-9 min-w-[36px] rounded-xl text-sm',
    lg: 'w-11 h-11 min-w-[44px] rounded-xl text-base',
    xl: 'w-13 h-13 min-w-[52px] rounded-2xl text-lg',
  }[size] || 'w-9 h-9 min-w-[36px] rounded-xl';

  const iconSizes = {
    xs: 12,
    sm: 15,
    md: 20,
    lg: 24,
    xl: 28,
  }[size] || 20;

  // Custom Logo Image provided via URL
  if (logoUrl && !imgError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-white dark:bg-[#1E2230] border border-zinc-200 dark:border-zinc-700/80 shadow-xs transition-transform ${sizeDimensions} ${className}`}
        title={String(code || 'Integration Provider')}
      >
        <img
          src={logoUrl}
          alt={String(code || 'Logo')}
          className="w-full h-full object-contain p-1"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 1. Meta / Facebook Lead Ads Logo
  if (norm === 'FACEBOOK') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform ${sizeDimensions} ${className}`}
        style={{ backgroundColor: '#1877F2' }}
        title="Meta / Facebook Lead Ads"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-full h-full p-[18%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // 2. IndiaMART B2B Portal Logo
  if (norm === 'INDIAMART') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform ${sizeDimensions} ${className}`}
        style={{ backgroundColor: '#2E3192' }}
        title="IndiaMART B2B Marketplace"
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-[14%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* IndiaMART Red Brand Dot */}
          <circle cx="11.5" cy="11.5" r="3.5" fill="#E41B23" />
          {/* Lower "i" stem */}
          <rect x="8.5" y="17.5" width="6" height="15" rx="1.5" fill="#FFFFFF" />
          {/* "m" arches in white */}
          <path
            d="M18 17.5h5.5v2.2c1.2-1.7 3.2-2.7 5.5-2.7 2.4 0 4.3 1 5.3 2.6 1.3-1.7 3.3-2.6 5.8-2.6 4.2 0 6.9 2.6 6.9 7.4V32.5h-5.5v-7.2c0-2.8-1.2-4.2-3.2-4.2-2 0-3.4 1.4-3.4 4V32.5h-5.5v-7.2c0-2.8-1.2-4.2-3.2-4.2-2 0-3.4 1.4-3.4 4V32.5H18V17.5Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // 3. TradeIndia Marketplace Logo
  if (norm === 'TRADEINDIA') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform border border-amber-400/30 ${sizeDimensions} ${className}`}
        style={{ backgroundColor: '#FFB800' }}
        title="TradeIndia B2B Marketplace"
      >
        <div className="flex flex-col items-center justify-center font-black leading-none tracking-tighter select-none">
          <span className="text-[#002D62] font-black text-[12px] sm:text-[13px] tracking-tight">ti</span>
          <span className="h-[2px] w-4 bg-[#ED1C24] rounded-full mt-[1px]" />
        </div>
      </div>
    );
  }

  // 4. Justdial Logo
  if (norm === 'JUSTDIAL') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform bg-[#FF6F00] text-white font-black ${sizeDimensions} ${className}`}
        title="Justdial B2B Inquiries"
      >
        <span className="text-white font-black text-xs tracking-tighter">JD</span>
      </div>
    );
  }

  // 5. LinkedIn Lead Gen Ads Logo
  if (norm === 'LINKEDIN_LEADS') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform bg-[#0A66C2] text-white font-bold ${sizeDimensions} ${className}`}
        title="LinkedIn Lead Gen Ads"
      >
        <span className="text-white font-black text-xs">in</span>
      </div>
    );
  }

  // 6. Google Ads Logo
  if (norm === 'GOOGLE_ADS') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform bg-white border border-zinc-200 dark:border-zinc-700 ${sizeDimensions} ${className}`}
        title="Google Ads Lead Form Extensions"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full p-[18%]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
      </div>
    );
  }

  // 7. Zapier Logo
  if (norm === 'ZAPIER') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform bg-[#FF4F00] text-white font-black ${sizeDimensions} ${className}`}
        title="Zapier Webhook Integration"
      >
        <span className="text-white font-black text-sm leading-none select-none">*</span>
      </div>
    );
  }

  // 8. Make (Integromat) Logo
  if (norm === 'MAKE') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs transition-transform bg-[#6D28D9] text-white font-black ${sizeDimensions} ${className}`}
        title="Make.com Scenario"
      >
        <span className="text-white font-black text-xs leading-none select-none tracking-tight">M</span>
      </div>
    );
  }

  // 9. Custom Generic Webhook / Unknown Provider Logo
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs bg-gradient-to-br from-emerald-500 to-teal-700 text-white ${sizeDimensions} ${className}`}
      title={String(code || 'Custom Connector')}
    >
      <Webhook size={iconSizes} strokeWidth={2.4} className="text-white drop-shadow-xs" />
    </div>
  );
}
