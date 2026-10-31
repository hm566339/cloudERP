import React from 'react';
import { Link } from 'react-router-dom';
import MarkLogo from '../../../components/common/MarkLogo';
import { scrollToSection } from './landingData';

export default function LandingFooter({ onOpenSignIn }) {
  const handleNavClick = (e, targetId) => {
    scrollToSection(e, targetId);
  };

  return (
    <footer className="border-t border-[#D5D8CA] dark:border-[#223326] bg-[#DCE2CF] dark:bg-[#070E08] pt-14 pb-12 text-xs text-[#485942] dark:text-[#A3B5A5] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-[#D5D8CA] dark:border-[#223326]">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-3.5">
            <Link to="/" className="flex items-center gap-2.5">
              <MarkLogo
                variant="dark"
                alt="Mark2 ERP Logo"
                className="h-8 w-auto object-contain dark:brightness-125"
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#2E3D28] dark:text-white tracking-tight leading-none">
                  Mark2 ERP
                </span>
                <span className="text-[10px] text-[#485942] dark:text-[#A3B5A5] font-medium">Enterprise Cloud</span>
              </div>
            </Link>
            <p className="text-xs text-[#485942] dark:text-[#A3B5A5] max-w-sm leading-relaxed">
              Unified multi-tenant cloud ERP connecting double-entry accounting, order-to-cash,
              procure-to-pay, multi-warehouse inventory, and statutory Indian GST compliance.
            </p>
            <div className="text-[11px] text-[#2E3D28] dark:text-[#34D399] font-mono">
              Designed & Engineered in India &bull; ISO-Ready Architecture
            </div>
          </div>

          {/* Col 2: ERP Capabilities */}
          <div>
            <h4 className="font-bold text-[#2E3D28] dark:text-[#ECF2EC] text-xs uppercase tracking-wider mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Finance & Accounts
                </a>
              </li>
              <li>
                <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Sales & Tax Invoicing
                </a>
              </li>
              <li>
                <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Procure-to-Pay (PO/GRN)
                </a>
              </li>
              <li>
                <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Multi-Warehouse Stock
                </a>
              </li>
              <li>
                <a href="#modules" onClick={(e) => handleNavClick(e, 'modules')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Statutory GST Filing
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Security */}
          <div>
            <h4 className="font-bold text-[#2E3D28] dark:text-[#ECF2EC] text-xs uppercase tracking-wider mb-3">
              Governance & Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#workflows" onClick={(e) => handleNavClick(e, 'workflows')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Approval Workflows
                </a>
              </li>
              <li>
                <a href="#security" onClick={(e) => handleNavClick(e, 'security')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Multi-Company Hierarchy
                </a>
              </li>
              <li>
                <a href="#security" onClick={(e) => handleNavClick(e, 'security')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Tenant Data Isolation
                </a>
              </li>
              <li>
                <a href="#roi-calculator" onClick={(e) => handleNavClick(e, 'roi-calculator')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  ROI Savings Calculator
                </a>
              </li>
              <li>
                <a href="#industries" onClick={(e) => handleNavClick(e, 'industries')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Industry Workflows
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Portals & Access */}
          <div>
            <h4 className="font-bold text-[#2E3D28] dark:text-[#ECF2EC] text-xs uppercase tracking-wider mb-3">
              Access & Evaluation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/try-free" className="font-semibold text-[#2E3D28] dark:text-[#34D399] hover:underline">
                  Start 30-Day Free Trial
                </Link>
              </li>
              <li>
                <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')} className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  SaaS Pricing Plans
                </a>
              </li>
              {onOpenSignIn ? (
                <li>
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors text-left"
                  >
                    Organization Portal Login
                  </button>
                </li>
              ) : (
                <li>
                  <Link to="/" className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                    Sign In
                  </Link>
                </li>
              )}
              <li>
                <Link to="/admin-login" className="hover:text-[#2E3D28] dark:hover:text-[#34D399] transition-colors">
                  Super Admin Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="text-[#485942] dark:text-[#A3B5A5]">
            &copy; {new Date().getFullYear()} Mark2 ERP Enterprise Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[#485942] dark:text-[#A3B5A5]">
            <span>PostgreSQL 16 &bull; Spring Boot 3 &bull; React 18</span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#2E3D28] dark:text-[#34D399]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] dark:bg-[#34D399]" />
              Production Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
