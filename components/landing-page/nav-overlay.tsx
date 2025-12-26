"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { ThemeSwitcher } from "@/components/wrappers/theme-switcher-wrapper";
import MetallicSheen from "@/components/wrappers/metallic-sheen-wrapper";
import { MotionToggleButton } from "@/components/ui/motion-toggle-button"; 
import { Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useMotion } from "@/components/context/motion-context";
import { useAuth } from "@/components/wrappers/auth-wrapper";


interface NavOverlayProps {
  navItems?: React.ReactNode; 
}

export default function NavOverlay({ navItems }: NavOverlayProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // === USE THE CONTEXT ===
  // No fetching, no useEffects. Just immediate data.
  const { user, isLoading, signOut } = useAuth();
  
  const pathname = usePathname(); 
  const { theme, setTheme } = useTheme();
  const { toggleMotion } = useMotion();

  // Close menu on route change
  useEffect(() => {
    if (isMenuOpen) {
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    if (isMenuOpen) {
      handleClose();
    } else {
      setIsMenuOpen(true);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleWrapperClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) {
      handleClose();
    }
  };

  const forwardPointerEvent = (e: React.PointerEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const event = new PointerEvent('pointermove', {
      bubbles: true, cancelable: true, view: window,
      clientX: e.clientX, clientY: e.clientY,
      pointerId: e.pointerId, width: e.width, height: e.height,
      pressure: e.pressure, isPrimary: e.isPrimary,
    });
    canvas.dispatchEvent(event);
  };

  const handleThemeRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.nav-action-btn')) return;
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogoutClick = async () => {
    await signOut();
    handleClose();
  };

  // Render auth buttons based on Context State
  const renderAuthButtons = () => {
    if (isLoading) {
      return (
        <div className="nav-auth-wrapper">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '2.25rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '0.75rem' }} />
            <div style={{ flex: 1, height: '2.25rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '0.75rem' }} />
          </div>
        </div>
      );
    }

    // Authenticated
    if (user) {
      return (
        <div className="nav-auth-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
              Welcome back, <span style={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}>
                {/* We use user_metadata for the name if available, or email */}
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </span>
            </span>
            <button onClick={handleLogoutClick} style={{ width: '100%' }}>
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    // Not Authenticated
    return (
      <div className="nav-auth-wrapper">
        <div>
          <Link href="/auth/login">Sign in</Link>
          <Link href="/auth/sign-up">Sign up</Link>
        </div>
      </div>
    );
  };

  return (
    <nav className="nav-overlay-container">
      <Link 
        href={"/"} 
        className="nav-logo-link"
        onPointerMove={forwardPointerEvent}
        onPointerEnter={forwardPointerEvent}
        onPointerLeave={forwardPointerEvent}
      >
        <MetallicSheen className="nav-logo-sheen"> 
          <h1 className="nav-logo-text">La Clair Ligña</h1>
        </MetallicSheen>
      </Link>
      
      <div className="nav-burger-container">
        <button 
          onClick={handleToggleMenu}
          className="nav-burger-btn"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className={`nav-mobile-overlay ${isClosing ? 'closing' : ''}`}>
          <div className="nav-layer-center">
            <div className="nav-content-width" onClick={handleWrapperClick}>
              {navItems && (
                <div className="nav-links-wrapper animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {navItems}
                </div>
              )}
            </div>
          </div>

          <div className="nav-layer-flow">
            <div className="nav-spacer-fill" />
            <div className="nav-preferences-container">
              <div className="nav-content-width space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="nav-preference-label-center">Preferences</div>
                <div className="nav-preferences-grid">
                  <div className="nav-preference-row-thin nav-btn-half" onClick={handleThemeRowClick}>
                    <span className="font-medium text-sm">Appearance</span>
                    <div className="scale-90 transition-transform hover:scale-95">
                      <ThemeSwitcher />
                    </div>
                  </div>
                  <div className="nav-preference-row-thin nav-btn-half" onClick={toggleMotion}>
                    <span className="font-medium text-sm">Animations</span>
                    <div className="scale-90 transition-transform hover:scale-95">
                      <MotionToggleButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nav-footer-container">
              <div className="nav-footer-content">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200" onClick={handleWrapperClick}>
                  {renderAuthButtons()}
                </div>
                <p className="nav-copyright">© 2025 La Clair Ligña Finance</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}