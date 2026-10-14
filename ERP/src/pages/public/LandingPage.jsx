import React, { useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectIsAuthenticated } from '../../features/auth/authSlice';
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
 * Designed according to Mark2 ERP theme (Dark slate/zinc surfaces, emerald accents, Inter & JetBrains Mono typography)
 * Showcases all project capabilities: Finance, Sales, Procurement, Inventory, GST, Workflows, Multi-Company Isolation
 */
export default function LandingPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-emerald-500/20 selection:text-zinc-900 overflow-x-hidden">
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
