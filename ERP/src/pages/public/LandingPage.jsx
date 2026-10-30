import React, { useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
import {
  applyLandingSageTheme,
  applyAppearance,
  loadSavedAppearance,
} from '../../features/theme/themePresets';
import {
  LandingNavbar,
  LandingHero,
  LandingDemoPreview,
  LandingModules,
  LandingWorkflows,
  LandingFeatures,
  LandingSecurity,
  LandingPricing,
  LandingCta,
  LandingFooter,
} from './landing';

/**
 * Component-based Mark2 ERP Enterprise Landing Page
 * Permanently locked to the approved Sage Nature brand identity:
 * - 60% Dominant Canvas: #E8E9DF
 * - 30% Secondary Surfaces & Accents: #A9B887
 * - 10% Primary Forest Green Action & Headings: #2E3D28
 *
 * Fully separated from the ERP application Theme Studio and Dark Mode settings.
 */
export default function LandingPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Permanently enforce Sage Nature palette on public website & restore ERP theme on exit
  useEffect(() => {
    applyLandingSageTheme();

    return () => {
      // Re-apply the user's ERP theme when navigating away from the public Landing Page
      const savedSettings = loadSavedAppearance();
      applyAppearance(savedSettings);
    };
  }, []);

  // Set document title & meta tags for SEO
  useEffect(() => {
    document.title = 'Mark2 ERP — Run Your Business Smarter with One Powerful ERP';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Mark2 ERP connects sales, procurement, multi-warehouse inventory, double-entry accounting, and statutory Indian GST in one secure multi-tenant platform. Start your 30-day free trial today.'
      );
    }
  }, []);

  return (
    <div
      className="landing-page-root min-h-screen bg-[#E8E9DF] font-sans text-[#2E3D28] selection:bg-[#A9B887]/30 selection:text-[#2E3D28] overflow-x-hidden"
      data-landing-page="true"
      style={{
        backgroundColor: '#E8E9DF',
        color: '#2E3D28',
        colorScheme: 'light',
      }}
    >
      {/* 1. Navigation Header with Announcement & Smooth-scroll Nav links */}
      <LandingNavbar isAuthenticated={isAuthenticated} />

      {/* 2. Hero Section with Interactive Demo Preview */}
      <LandingHero>
        <LandingDemoPreview />
      </LandingHero>

      {/* 3. Integrated Capabilities & 6-Module Grid (#modules) */}
      <LandingModules />

      {/* 4. Connected Pipelines & Approval Governance Visualizer (#workflows) */}
      <LandingWorkflows />

      {/* 5. Enterprise Benefits & Features Grid (#features) */}
      <LandingFeatures />

      {/* 6. Multi-Company Architecture & Tenant Isolation (#security) */}
      <LandingSecurity />

      {/* 7. Transparent Evaluation & Interactive FAQs (#pricing) */}
      <LandingPricing />

      {/* 8. Bottom Call to Action */}
      <LandingCta />

      {/* 9. Footer with Smooth Scroll Links */}
      <LandingFooter />
    </div>
  );
}
