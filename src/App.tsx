import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LandingHero } from "./components/LandingHero";
import { Dock } from "./components/Dock";
import { Home } from "./components/Home";
import { About } from "./components/About";
import {
  Work,
  resolveDeepLinkFromSearch,
  clearDeepLinkParamsFromUrl,
  warmUpPortfolioAssets,
} from "./components/Work";
import { Contact } from "./components/Contact";
import { ResumePreviewContext } from "./components/ResumeControls";
import {
  ResumePreviewModal,
  warmUpResumePdfDocument,
} from "./components/ResumePreviewModal";
import {
  preloadAllMotionGraphicsAssets,
  PrewarmedCommercialAssetBank,
} from "./motionGraphics/preloadAssets";
import { preloadOfficeHeroAssets } from "./components/OfficeHeroShowcase";

export default function App() {
  const prefersReducedMotion = useReducedMotion();

  const [isLandingVisible, setIsLandingVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const deepLink = resolveDeepLinkFromSearch(window.location.search);
    if (deepLink) return false;
    if (window.location.search) {
      clearDeepLinkParamsFromUrl();
    }
    return true;
  });

  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined") {
      const deepLink = resolveDeepLinkFromSearch(window.location.search);
      if (deepLink) return "work";
    }
    return "home";
  });

  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const resumeTriggerRef = useRef<HTMLElement | null>(null);
  const sectionScrollSnapshotRef = useRef<{
    el: HTMLElement | null;
    scrollTop: number;
  }>({ el: null, scrollTop: 0 });
  const sectionViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const deepLink = resolveDeepLinkFromSearch(window.location.search);
      if (deepLink) {
        setIsLandingVisible(false);
        setActiveSection("work");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Start preloading & decoding all 2D commercial assets, office hero illustrations,
  // and first original mockups immediately in the background while the intro plays
  useEffect(() => {
    void preloadOfficeHeroAssets();
    void preloadAllMotionGraphicsAssets();
    const timer = window.setTimeout(() => {
      warmUpPortfolioAssets();
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  // Prewarm PDF.js worker & resume document when visiting About Me or Contact Me
  useEffect(() => {
    if (activeSection === "about" || activeSection === "contact") {
      void warmUpResumePdfDocument().catch(() => {
        // Handled cleanly inside ResumePreviewModal if triggered offline
      });
    }
  }, [activeSection]);

  const handleOpenResumePreview = useCallback(
    (triggerEl?: HTMLElement | null) => {
      const resolvedTrigger =
        triggerEl ?? (document.activeElement as HTMLElement | null);
      resumeTriggerRef.current = resolvedTrigger;
      // Snapshot active section scroll container (.overflow-y-auto) so exact scroll position is guaranteed on close
      const scrollableSection =
        resolvedTrigger?.closest<HTMLElement>(".overflow-y-auto") ??
        sectionViewportRef.current?.querySelector<HTMLElement>(
          ".overflow-y-auto, section"
        ) ??
        null;
      sectionScrollSnapshotRef.current = {
        el: scrollableSection,
        scrollTop: scrollableSection ? scrollableSection.scrollTop : 0,
      };
      setIsResumePreviewOpen(true);
    },
    []
  );

  const handleCloseResumePreview = useCallback(() => {
    setIsResumePreviewOpen(false);
    const { el, scrollTop } = sectionScrollSnapshotRef.current;
    const triggerEl = resumeTriggerRef.current;
    window.requestAnimationFrame(() => {
      if (el && Math.abs(el.scrollTop - scrollTop) > 1) {
        const prevBehavior = el.style.scrollBehavior;
        el.style.scrollBehavior = "auto";
        el.scrollTop = scrollTop;
        el.style.scrollBehavior = prevBehavior;
      }
      if (triggerEl && document.contains(triggerEl)) {
        triggerEl.focus({ preventScroll: true });
      }
    });
  }, []);

  const handleWarmUpResume = useCallback(() => {
    void warmUpResumePdfDocument().catch(() => {});
  }, []);

  const resumeContextValue = useMemo(
    () => ({
      openResumePreview: handleOpenResumePreview,
      warmUpResumePreview: handleWarmUpResume,
    }),
    [handleOpenResumePreview, handleWarmUpResume]
  );

  const handleExplore = useCallback(() => {
    setIsLandingVisible(false);
  }, []);

  const handleReturnToLanding = useCallback(() => {
    clearDeepLinkParamsFromUrl();
    setIsResumePreviewOpen(false);
    setActiveSection((prev) => (prev === "home" ? prev : "home"));
    setIsLandingVisible((prev) => (prev ? prev : true));
  }, []);

  return (
    <ResumePreviewContext.Provider value={resumeContextValue}>
      <div className="relative bg-white h-[100dvh] w-full overflow-hidden flex flex-col">
        {/* GPU-Lightweight Ambient Background (pure #FFFFFF on Home so office canvas blends seamlessly) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-white select-none"
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
          aria-hidden="true"
        >
          {activeSection !== "home" && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 22% 22%, rgba(244, 244, 245, 0.85) 0%, rgba(244, 244, 245, 0) 55%), radial-gradient(circle at 78% 78%, rgba(228, 228, 231, 0.55) 0%, rgba(228, 228, 231, 0) 52%), radial-gradient(circle at 55% 42%, rgba(250, 250, 250, 0.9) 0%, rgba(255, 255, 255, 0) 50%)",
              }}
            />
          )}
        </div>

        {/* Main Portfolio Shell (pre-mounted underneath Intro; avoids toggling display:contents in Safari) */}
        <div
          aria-hidden={isLandingVisible}
          className={isLandingVisible ? "pointer-events-none" : ""}
        >
          <Dock
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onReturnToLanding={handleReturnToLanding}
          />

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            style={{ willChange: "transform, opacity" }}
            className="absolute inset-0 z-10 pointer-events-none pt-[72px] md:pt-[88px] lg:pt-[100px]"
          >
            <div
              ref={sectionViewportRef}
              className="relative w-full h-full pointer-events-auto"
            >
              <AnimatePresence mode={prefersReducedMotion ? "sync" : "wait"}>
                {activeSection === "home" && (
                  <Home
                    key="home"
                    setActiveSection={setActiveSection}
                    isIntroActive={isLandingVisible}
                  />
                )}
                {activeSection === "about" && <About key="about" />}
                {activeSection === "work" && <Work key="work" />}
                {activeSection === "contact" && (
                  <Contact key="contact" setActiveSection={setActiveSection} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Cinematic Visual Identity Intro Curtain */}
        <AnimatePresence>
          {isLandingVisible && (
            <LandingHero key="landing-hero" onExplore={handleExplore} />
          )}
        </AnimatePresence>

        {/* Centralised In-Website PDF Previewer (Shared by About Me & Contact Me) */}
        <ResumePreviewModal
          isOpen={isResumePreviewOpen}
          onClose={handleCloseResumePreview}
        />

        {/* Offscreen 1x1px Bitmap Cache Warmer so 2D commercials open at 0ms */}
        <PrewarmedCommercialAssetBank />
      </div>
    </ResumePreviewContext.Provider>
  );
}
