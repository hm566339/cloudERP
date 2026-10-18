import React from 'react';
import { Link } from 'react-router-dom';
import MarkLogo from '../../../components/common/MarkLogo';
import { scrollToSection } from './landingData';

export default function LandingFooter() {
  const handleNavClick = (e, targetId) => {
    scrollToSection(e, targetId);
  };

  return (
    <footer className="border-t border-zinc-200 bg-white py-12 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <MarkLogo
            variant="light"
            alt="Mark2 ERP Logo"
            className="h-7 w-auto object-contain"
          />
          <span className="text-center sm:text-left">© {new Date().getFullYear()} Mark2 ERP Platform. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-zinc-600 text-center">
          <a
            href="#features"
            onClick={(e) => handleNavClick(e, 'features')}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#modules"
            onClick={(e) => handleNavClick(e, 'modules')}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Modules
          </a>
          <a
            href="#security"
            onClick={(e) => handleNavClick(e, 'security')}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Security
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleNavClick(e, 'pricing')}
            className="hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Pricing
          </a>
          <Link to="/try-free" className="hover:text-zinc-900 transition-colors">
            Free Trial
          </Link>
          <Link to="/" className="hover:text-zinc-900 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
