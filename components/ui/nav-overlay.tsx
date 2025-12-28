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
  
  const { user, isLoading, signOut } = useAuth();
  
  const pathname = usePathname(); 
  // CHANGED: Destructure resolvedTheme to know the ACTUAL look (System Dark vs Real Dark)
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggleMotion } = useMotion();

  useEffect(() => {
    if (isMenuOpen) {
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    // Prevent triggering if clicking the button directly (redundant with stopPropagation below, but good safety)
    if ((e.target as HTMLElement).closest('.nav-action-btn')) return;
    
    // CHANGED: Toggle based on what the user SEES (resolvedTheme), not just the setting string.
    // This ensures if you are on "System (Dark)", clicking the row toggles to "Light".
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogoutClick = async () => {
    await signOut();
    handleClose();
  };

  const renderAuthButtons = () => {
    if (isLoading) {
      return (
        <div className="nav-auth-wrapper">
          <div>
            <div className="h-9 w-24 rounded-xl bg-muted/30 animate-pulse" />
            <div className="h-9 w-24 rounded-xl bg-muted/30 animate-pulse" />
          </div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="w-full space-y-3">
          <div className="text-center text-sm text-muted-foreground">
            Welcome back, <span className="font-bold text-foreground">
              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            </span>
          </div>
          
          <div className="nav-auth-wrapper">
            <div>
              <button 
                onClick={handleLogoutClick}
                className="nav-auth-btn nav-auth-btn-primary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="nav-auth-wrapper">
        <div>
          <Link 
            href="/auth/login" 
            className="nav-auth-btn nav-auth-btn-primary"
          >
            Sign in
          </Link>
          
          <Link 
            href="/auth/sign-up" 
            className="nav-auth-btn nav-auth-btn-outline"
          >
            Sign up
          </Link>
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
                  
                  {/* APPEARANCE ROW */}
                  <div className="nav-preference-row-thin nav-btn-half" onClick={handleThemeRowClick}>
                    <span className="font-medium text-sm">Appearance</span>
                    
                    {/* 
                        CHANGED: Added onClick={e => e.stopPropagation()} 
                        This prevents clicks inside the dropdown (like selecting "System")
                        from bubbling up and triggering handleThemeRowClick.
                    */}
                    <div 
                      className="scale-90 transition-transform hover:scale-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ThemeSwitcher />
                    </div>
                  </div>

                  {/* ANIMATIONS ROW */}
                  <div className="nav-preference-row-thin nav-btn-half" onClick={toggleMotion}>
                    <span className="font-medium text-sm">Animations</span>
                    
                    {/* Added stopPropagation here too for consistency */}
                    <div 
                      className="scale-90 transition-transform hover:scale-95"
                      onClick={(e) => e.stopPropagation()}
                    >
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