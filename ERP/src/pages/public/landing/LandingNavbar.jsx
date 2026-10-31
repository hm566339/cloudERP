import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X, LogIn } from 'lucide-react';
import MarkLogo from '../../../components/common/MarkLogo';
import ThemeToggle from '../../../components/common/ThemeToggle';
import { scrollToSection } from './landingData';
import LandingSignInModal from './LandingSignInModal';

export default function LandingNavbar({ isAuthenticated, onOpenSignIn }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  const handleOpenSignIn = () => {
    if (typeof onOpenSignIn === 'function') {
      onOpenSignIn();
    } else {
      setSignInModalOpen(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e, targetId) => {
    scrollToSection(e, targetId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 w-full transition-all duration-200">
        {/* Top Announcement Bar with Emerald Accents */}
        <div
          className={`bg-[#2E3D28] dark:bg-[#071008] text-[#F7F7F0] text-xs px-3 sm:px-4 text-center font-medium border-b border-[#243320] dark:border-[#142316] flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 overflow-hidden ${
            isScrolled ? 'max-h-0 py-0 opacity-0 pointer-events-none' : 'max-h-12 py-2 opacity-100'
          }`}
        >
          <span className="inline-flex items-center gap-1 bg-[#10B981]/25 text-[#A9B887] dark:text-[#34D399] border border-[#10B981]/30 px-2.5 py-0.5 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wide shrink-0">
            <Sparkles size={11} className="text-[#34D399]" /> 30-Day Free Trial
          </span>
          <span className="text-[#DCE2CF] truncate text-[11px] sm:text-xs">
            Unified accounting, sales, procurement, and multi-warehouse inventory. No credit card required.
          </span>
          <Link
            to="/try-free"
            className="text-[#34D399] hover:text-white underline font-semibold text-[11px] sm:text-xs shrink-0 ml-1 transition-colors"
          >
            Start Trial &rarr;
          </Link>
        </div>

        {/* Main Navbar: Adapts to Light and Dark Theme */}
        <header
          className={`w-full transition-all duration-200 ${
            isScrolled
              ? 'bg-[#F7F7F0]/95 dark:bg-[#0A160D]/95 backdrop-blur-md shadow-md border-b border-[#D5D8CA] dark:border-[#1A3622]'
              : 'bg-[#F7F7F0]/85 dark:bg-[#0A160D]/85 backdrop-blur-md border-b border-[#D5D8CA]/80 dark:border-[#1A3622]/70'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* LEFT: Mark2 ERP Logo */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <MarkLogo
                variant="auto"
                alt="Mark2 ERP Logo"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-sm text-[#2E3D28] dark:text-[#F7F7F0] tracking-tight leading-none">
                  Mark2 ERP
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#16A34A] dark:text-[#34D399] font-medium">Enterprise Cloud</span>
              </div>
            </Link>

            {/* CENTER: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-xs font-semibold text-[#485942] dark:text-[#DCE2CF]">
              <a
                href="#overview"
                onClick={(e) => handleNavClick(e, 'overview')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                Overview
              </a>
              <a
                href="#modules"
                onClick={(e) => handleNavClick(e, 'modules')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                Modules
              </a>
              <a
                href="#workflows"
                onClick={(e) => handleNavClick(e, 'workflows')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                Workflows
              </a>
              <a
                href="#security"
                onClick={(e) => handleNavClick(e, 'security')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                Security & Multi-Company
              </a>
              <a
                href="#roi-calculator"
                onClick={(e) => handleNavClick(e, 'roi-calculator')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                ROI Calculator
              </a>
              <a
                href="#pricing"
                onClick={(e) => handleNavClick(e, 'pricing')}
                className="hover:text-[#2E3D28] dark:hover:text-white transition-colors py-1 cursor-pointer"
              >
                Pricing
              </a>
            </nav>

            {/* RIGHT: Action Buttons */}
            <div className="hidden sm:flex items-center gap-2.5">
              <ThemeToggle size="sm" />

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate('/company-select')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] text-[#051A0E] text-xs font-bold hover:bg-[#34D399] active:scale-[0.98] transition-all shadow-md"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleOpenSignIn}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[#2E3D28] dark:text-[#F7F7F0] hover:bg-[#EDEEE4] dark:hover:bg-white/10 text-xs font-semibold border border-[#D5D8CA] dark:border-white/20 transition-colors"
                  >
                    <LogIn size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                    <span>Sign In</span>
                  </button>

                  <Link
                    to="/try-free"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-[#051A0E] text-xs font-bold hover:bg-[#34D399] transition-all duration-150 active:scale-[0.98] shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="lg:hidden flex items-center gap-1.5">
              <ThemeToggle size="sm" />
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={handleOpenSignIn}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E3D28] dark:text-[#F7F7F0] bg-[#F7F7F0] dark:bg-white/10 border border-[#D5D8CA] dark:border-white/20"
                >
                  Sign In
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-[#2E3D28] dark:text-white hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-x-0 top-[64px] bottom-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div
                className="bg-[#F7F7F0] dark:bg-[#0A160D] border-b border-[#D5D8CA] dark:border-[#1A3622] px-5 pt-4 pb-8 space-y-4 shadow-2xl text-[#2E3D28] dark:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  <a
                    href="#overview"
                    onClick={(e) => handleNavClick(e, 'overview')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Overview</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                  <a
                    href="#modules"
                    onClick={(e) => handleNavClick(e, 'modules')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Modules & Features</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                  <a
                    href="#workflows"
                    onClick={(e) => handleNavClick(e, 'workflows')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Approval Workflows</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                  <a
                    href="#security"
                    onClick={(e) => handleNavClick(e, 'security')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Multi-Company Architecture</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                  <a
                    href="#roi-calculator"
                    onClick={(e) => handleNavClick(e, 'roi-calculator')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>ROI Calculator</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                  <a
                    href="#pricing"
                    onClick={(e) => handleNavClick(e, 'pricing')}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] dark:text-[#DCE2CF] hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Pricing Plans</span>
                    <ArrowRight size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                  </a>
                </div>

                <div className="pt-3 border-t border-[#D5D8CA] dark:border-[#1A3622] space-y-2">
                  <Link
                    to="/try-free"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] text-[#051A0E] text-xs font-bold hover:bg-[#34D399] transition-colors shadow-md"
                  >
                    <span>Start 30-Day Free Trial</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenSignIn();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#D5D8CA] dark:border-white/20 text-[#2E3D28] dark:text-[#F7F7F0] text-xs font-semibold hover:bg-[#EDEEE4] dark:hover:bg-white/10 transition-colors"
                  >
                    <LogIn size={14} className="text-[#16A34A] dark:text-[#34D399]" />
                    <span>Sign In to Your Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Sign In Modal */}
      <LandingSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </>
  );
}
