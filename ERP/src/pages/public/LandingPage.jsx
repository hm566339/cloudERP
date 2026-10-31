import React, { useState, useEffect } from 'react';
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
  LandingRoiCalculator,
  LandingIndustryUseCases,
  LandingPricing,
  LandingCta,
  LandingFooter,
  LandingSignInModal,
} from './landing';

/**
 * Enterprise Mark2 ERP Public Landing Page
 * Permanently locked to the approved Sage Nature brand identity:
 * - 60% Dominant Canvas: #E8E9DF
 * - 30% Secondary Surfaces & Accents: #A9B887
 * - 10% Primary Forest Green Action & Headings: #2E3D28
 *
 * Fully separated from the ERP application Theme Studio and Dark Mode settings.
 */
export default function LandingPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const resolvedTheme = useAppSelector((s) => s.theme?.resolvedTheme || 'light');
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Enforce Sage Nature palette (Light or Dark) on public website & restore ERP theme on exit
  useEffect(() => {
    applyLandingSageTheme(resolvedTheme);

    return () => {
      // Re-apply the user's ERP theme when navigating away from the public Landing Page
      const savedSettings = loadSavedAppearance();
      applyAppearance(savedSettings);
    };
  }, [resolvedTheme]);

  // Set document title & meta tags for SEO
  useEffect(() => {
    document.title = 'Mark2 ERP — Run Your Business Smarter with One Powerful Multi-Company ERP';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Mark2 ERP connects sales, procurement, multi-warehouse inventory, double-entry accounting, and statutory Indian GST in one secure multi-tenant platform. Start your 30-day free trial today.'
      );
    }
  }, []);

  const handleOpenSignIn = () => {
    setSignInModalOpen(true);
  };

  return (
    <div
      className="landing-page-root min-h-screen bg-[var(--color-bg-base)] dark:bg-[#101411] font-sans text-[var(--color-text-primary)] dark:text-[#ECF2EC] selection:bg-[#A9B887]/30 selection:text-[#2E3D28] overflow-x-hidden transition-colors duration-300"
      data-landing-page="true"
    >
      {/* 1. Navigation Header with Announcement & Smooth-scroll Nav links */}
      <LandingNavbar
        isAuthenticated={isAuthenticated}
        onOpenSignIn={handleOpenSignIn}
      />

      {/* 2. Hero Section with Interactive Live Workspace Demo Preview */}
      <LandingHero onOpenSignIn={handleOpenSignIn}>
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

      {/* 7. Interactive Business ROI & Value Assessment Calculator (#roi-calculator) */}
      <LandingRoiCalculator />

      {/* 8. Targeted Industry Workflows & Verified Integrations (#industries) */}
      <LandingIndustryUseCases />

      {/* 9. Transparent Evaluation Plans & Interactive FAQs (#pricing) */}
      <LandingPricing />

      {/* 10. Bottom High-Conversion Call to Action */}
      <LandingCta onOpenSignIn={handleOpenSignIn} />

      {/* 11. Enterprise Footer with Smooth Scroll Links */}
      <LandingFooter onOpenSignIn={handleOpenSignIn} />

      {/* 12. Accessible Organization Login Portal Finder Modal */}
      <LandingSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </div>
  );
}
