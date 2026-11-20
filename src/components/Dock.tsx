import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Home, User, Briefcase, Mail, Menu, X } from "lucide-react";

interface DockProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onReturnToLanding?: () => void;
}

const HORIZONTAL_DOMINANCE_RATIO = 1.5;

export function Dock({
  activeSection,
  setActiveSection,
  onReturnToLanding,
}: DockProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const gestureRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lockedVertical: boolean;
    triggered: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lockedVertical: false,
    triggered: false,
  });

  const resetGesture = () => {
    gestureRef.current.active = false;
    gestureRef.current.pointerId = null;
    gestureRef.current.lockedVertical = false;
    gestureRef.current.triggered = false;
  };

  const triggerSwipeReturn = () => {
    if (gestureRef.current.triggered) return;
    gestureRef.current.triggered = true;
    setIsMobileMenuOpen(false);
    if (onReturnToLanding) {
      onReturnToLanding();
    } else if (activeSection !== "home") {
      setActiveSection("home");
    }
  };

  const evaluateSwipe = (clientX: number, clientY: number): boolean => {
    const g = gestureRef.current;
    if (!g.active || g.lockedVertical || g.triggered) return false;
    const dx = clientX - g.startX;
    const dy = clientY - g.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absY > 12 && absY > absX) {
      g.lockedVertical = true;
      return false;
    }
    if (dx <= -28 && absX >= absY * HORIZONTAL_DOMINANCE_RATIO) {
      triggerSwipeReturn();
      return true;
    }
    return false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLHeadingElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    gestureRef.current = {
      active: true,
      pointerId: null,
      startX: t.clientX,
      startY: t.clientY,
      lastX: t.clientX,
      lastY: t.clientY,
      lockedVertical: false,
      triggered: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLHeadingElement>) => {
    const g = gestureRef.current;
    if (!g.active || g.lockedVertical || e.touches.length !== 1) return;
    const t = e.touches[0];
    g.lastX = t.clientX;
    g.lastY = t.clientY;
    evaluateSwipe(t.clientX, t.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLHeadingElement>) => {
    const g = gestureRef.current;
    if (!g.active) return;
    const t = e.changedTouches[0];
    const endX = t ? t.clientX : g.lastX;
    const endY = t ? t.clientY : g.lastY;
    evaluateSwipe(endX, endY);
    resetGesture();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLHeadingElement>) => {
    if (e.pointerType !== "touch" && e.button === 0) {
      gestureRef.current = {
        active: true,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lockedVertical: false,
        triggered: false,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLHeadingElement>) => {
    if (e.pointerType === "touch") return;
    const g = gestureRef.current;
    if (!g.active || g.pointerId !== e.pointerId || g.lockedVertical) return;
    g.lastX = e.clientX;
    g.lastY = e.clientY;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (
      Math.abs(dx) > 8 &&
      Math.abs(dx) > Math.abs(dy) * HORIZONTAL_DOMINANCE_RATIO &&
      !e.currentTarget.hasPointerCapture(e.pointerId)
    ) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture errors
      }
    }
    evaluateSwipe(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLHeadingElement>) => {
    if (e.pointerType === "touch") return;
    const g = gestureRef.current;
    if (!g.active || g.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore release errors
      }
    }
    evaluateSwipe(e.clientX, e.clientY);
    resetGesture();
  };

  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.scrollTop !== "number") return;
      const scrollTop = target.scrollTop;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          const atTop = scrollTop <= 10;
          setIsAtTop((prev) => (prev === atTop ? prev : atTop));
          if (atTop) {
            setIsScrolling((prev) => (prev ? false : prev));
            if (scrollTimer) clearTimeout(scrollTimer);
            return;
          }
          setIsScrolling((prev) => (prev ? prev : true));
          if (scrollTimer) clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            setIsScrolling(false);
          }, 400);
        });
      }
    };

    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      if (scrollTimer) clearTimeout(scrollTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [isMobileMenuOpen]);

  const isElevated = isScrolling && !isAtTop;

  const navItems = [
    { id: "home", name: "Home", icon: Home, isItalic: false },
    { id: "about", name: "About Me", icon: User, isItalic: false },
    { id: "work", name: "My Work", icon: Briefcase, isItalic: false },
    { id: "contact", name: "Contact Me", icon: Mail, isItalic: false },
  ];

  const handleMobileSelect = (id: string) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -24, scale: 0.96, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="fixed z-50 top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 lg:top-6 lg:left-8 lg:right-8 flex justify-center pointer-events-none"
    >
      <div className="relative w-full max-w-7xl flex flex-col items-center pointer-events-none">
        <motion.div
          animate={{
            borderRadius: isElevated ? "16px" : "9999px",
            backgroundColor: isElevated
              ? "rgba(255, 255, 255, 0.9)"
              : "rgba(255, 255, 255, 0.5)",
            boxShadow: isElevated
              ? "0 12px 40px -10px rgba(0, 0, 0, 0.12)"
              : "0 4px 20px -5px rgba(0, 0, 0, 0.05)",
            scaleX: isElevated ? 1.01 : 1,
            scaleY: isElevated ? 1.02 : 1,
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-nav px-3 md:px-4 py-1 md:py-1.5 flex items-center justify-between w-full h-[48px] md:h-[54px] pointer-events-auto origin-center border border-black/5"
          style={{
            backdropFilter: isElevated ? "blur(32px)" : "blur(16px)",
            WebkitBackdropFilter: isElevated ? "blur(32px)" : "blur(16px)",
            willChange: "transform, border-radius, background-color, box-shadow",
          }}
        >
          {/* Mobile & Tablet Bar */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full h-full lg:hidden">
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={
                  isMobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={isMobileMenuOpen}
                className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full text-zinc-800 hover:text-zinc-950 hover:bg-black/5 active:scale-95 transition-all outline-none"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileMenuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex items-center justify-center"
                    >
                      <X size={19} className="stroke-[1.75]" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: 45, scale: 0.85 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -45, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex items-center justify-center"
                    >
                      <Menu size={19} className="stroke-[1.75]" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="flex items-center justify-center px-2 min-w-0">
              <h1
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={resetGesture}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={resetGesture}
                style={{ touchAction: "pan-y" }}
                className="text-[13px] sm:text-[14px] md:text-[15px] font-medium tracking-tight text-zinc-900 cursor-default select-none whitespace-nowrap truncate"
              >
                Kanika's{" "}
                <span className="text-zinc-500 font-light italic">
                  Portfolio
                </span>
              </h1>
            </div>

            <div className="flex items-center justify-end" aria-hidden="true" />
          </div>

          {/* Desktop Bar */}
          <div className="hidden lg:flex items-center justify-between w-full h-full">
            <div className="flex-shrink-0 flex items-center h-full mr-6 ml-4">
              <h1
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={resetGesture}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={resetGesture}
                style={{ touchAction: "pan-y" }}
                className="text-[15px] font-medium tracking-tight text-zinc-900 cursor-default select-none whitespace-nowrap"
              >
                Kanika's{" "}
                <span className="text-zinc-500 font-light italic">
                  Portfolio
                </span>
              </h1>
            </div>

            <nav className="flex items-center gap-1 h-full">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className="group relative flex items-center justify-center rounded-full px-3 py-1.5 outline-none h-full transition-transform active:scale-95 whitespace-nowrap"
                  >
                    <div className="relative z-10 flex items-center gap-2">
                      <span
                        className={`text-[12px] font-medium transition-colors duration-300 tracking-wide whitespace-nowrap z-10 ${
                          item.isItalic ? "italic" : ""
                        } ${
                          isActive
                            ? "text-zinc-900"
                            : "text-zinc-500 group-hover:text-zinc-700"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5"
                        transition={{
                          type: "spring",
                          bounce: 0.15,
                          duration: 0.5,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden w-full mt-2.5 bg-white/85 backdrop-blur-2xl border border-black/10 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.12)] rounded-3xl p-2 pointer-events-auto overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileSelect(item.id)}
                      className={`group relative flex items-center justify-between w-full px-4 py-3 rounded-2xl text-left transition-all duration-200 outline-none active:scale-[0.99] ${
                        isActive
                          ? "bg-zinc-900/5 text-zinc-900 font-medium"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          size={17}
                          className={`flex-shrink-0 stroke-[1.6] transition-colors ${
                            isActive
                              ? "text-zinc-900"
                              : "text-zinc-400 group-hover:text-zinc-700"
                          }`}
                        />
                        <span
                          className={`text-[14px] md:text-[15px] tracking-tight truncate ${
                            item.isItalic ? "italic" : ""
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      {isActive && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-900 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
