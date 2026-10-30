import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';
import MarkLogo from '../../../components/common/MarkLogo';
import { scrollToSection } from './landingData';

export default function LandingNavbar({ isAuthenticated }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    <div className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200">
      {/* ── Top Announcement Bar (Collapses smoothly on scroll) ── */}
      <div
        className={`bg-[#2E3D28] text-[#F7F7F0] text-xs px-3 sm:px-4 text-center font-medium border-b border-[#243320] flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 overflow-hidden ${
          isScrolled ? 'max-h-0 py-0 opacity-0 pointer-events-none' : 'max-h-12 py-2 opacity-100'
        }`}
      >
        <span className="inline-flex items-center gap-1 bg-[#A9B887]/25 text-[#DCE2CF] px-2.5 py-0.5 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wide shrink-0">
          <Sparkles size={11} className="text-[#A9B887]" /> 30-Day Free Trial
        </span>
        <span className="text-[#E8E9DF] truncate text-[11px] sm:text-xs">
          Experience unified accounting, sales, procurement, and inventory for 30 days. No credit card required.
        </span>
        <Link
          to="/try-free"
          className="text-white underline hover:text-[#A9B887] font-semibold text-[11px] sm:text-xs shrink-0 ml-1 transition-colors"
        >
          Start Trial &rarr;
        </Link>
      </div>

      {/* ── Header / Navigation (Fixed on scroll with permanent Sage Nature backdrop) ── */}
      <header
        className={`w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[#E8E9DF]/95 backdrop-blur-md shadow-xs border-b border-[#D5D8CA]'
            : 'bg-[#E8E9DF]/90 backdrop-blur-md border-b border-[#D5D8CA]/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: Mark2 ERP Logo & Enterprise Branding */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <MarkLogo
              variant="dark"
              alt="Mark2 ERP Logo"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm text-[#2E3D28] tracking-tight leading-none">
                Mark2 ERP
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#485942] font-medium">Enterprise Cloud</span>
            </div>
          </Link>

          {/* CENTER: Desktop Navigation Links with Smooth Scrolling */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#485942]">
            <a
              href="#overview"
              onClick={(e) => handleNavClick(e, 'overview')}
              className="hover:text-[#2E3D28] transition-colors py-1 cursor-pointer"
            >
              Overview
            </a>
            <a
              href="#modules"
              onClick={(e) => handleNavClick(e, 'modules')}
              className="hover:text-[#2E3D28] transition-colors py-1 cursor-pointer"
            >
              Modules
            </a>
            <a
              href="#workflows"
              onClick={(e) => handleNavClick(e, 'workflows')}
              className="hover:text-[#2E3D28] transition-colors py-1 cursor-pointer"
            >
              Workflows
            </a>
            <a
              href="#security"
              onClick={(e) => handleNavClick(e, 'security')}
              className="hover:text-[#2E3D28] transition-colors py-1 cursor-pointer"
            >
              Security
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, 'pricing')}
              className="hover:text-[#2E3D28] transition-colors py-1 cursor-pointer"
            >
              Pricing/Trial
            </a>
          </nav>

          {/* RIGHT: Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/company-select')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E3D28] text-white text-xs font-semibold hover:bg-[#3C4E34] active:bg-[#243320] transition-colors active:scale-[0.98] shadow-xs"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <Link
                to="/try-free"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E3D28] text-white text-xs font-semibold hover:bg-[#3C4E34] active:bg-[#243320] transition-colors active:scale-[0.98] shadow-xs"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Mobile Right: Menu Button */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-[#2E3D28] hover:bg-[#EDEEE4] active:bg-[#DCE2CF] transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer with Backdrop Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[64px] bottom-0 bg-black/30 backdrop-blur-xs z-40" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="bg-[#F7F7F0] border-b border-[#D5D8CA] px-5 pt-4 pb-8 space-y-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <a
                  href="#overview"
                  onClick={(e) => handleNavClick(e, 'overview')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] hover:bg-[#EDEEE4] transition-colors cursor-pointer"
                >
                  <span>Overview</span>
                  <ArrowRight size={14} className="text-[#485942]" />
                </a>
                <a
                  href="#modules"
                  onClick={(e) => handleNavClick(e, 'modules')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] hover:bg-[#EDEEE4] transition-colors cursor-pointer"
                >
                  <span>Modules</span>
                  <ArrowRight size={14} className="text-[#485942]" />
                </a>
                <a
                  href="#workflows"
                  onClick={(e) => handleNavClick(e, 'workflows')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] hover:bg-[#EDEEE4] transition-colors cursor-pointer"
                >
                  <span>Workflows</span>
                  <ArrowRight size={14} className="text-[#485942]" />
                </a>
                <a
                  href="#security"
                  onClick={(e) => handleNavClick(e, 'security')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] hover:bg-[#EDEEE4] transition-colors cursor-pointer"
                >
                  <span>Security</span>
                  <ArrowRight size={14} className="text-[#485942]" />
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, 'pricing')}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-semibold text-[#2E3D28] hover:bg-[#EDEEE4] transition-colors cursor-pointer"
                >
                  <span>Pricing / Trial</span>
                  <ArrowRight size={14} className="text-[#485942]" />
                </a>
              </div>

              <div className="pt-3 border-t border-[#D5D8CA] flex flex-col gap-2.5">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/company-select');
                    }}
                    className="w-full text-center py-3 rounded-xl bg-[#2E3D28] text-white text-xs font-semibold hover:bg-[#3C4E34] transition-colors shadow-xs"
                  >
                    Go to Workspace
                  </button>
                ) : (
                  <Link
                    to="/try-free"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-xl bg-[#2E3D28] text-white text-xs font-semibold hover:bg-[#3C4E34] transition-colors shadow-xs"
                  >
                    Start Free Trial
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
