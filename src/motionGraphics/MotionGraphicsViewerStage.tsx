import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, X } from "lucide-react";
import type { PortfolioProject, ViewerPlaybackState } from "../components/Work";
import { Raymond2DCommercial } from "./Raymond2DCommercial";
import { AlhindAir2DCommercial } from "./AlhindAir2DCommercial";
import { PaperBoat2DCommercial } from "./PaperBoat2DCommercial";
import { Zambara2DCommercial } from "./Zambara2DCommercial";
import { Reva2DCommercial } from "./Reva2DCommercial";

export interface MotionGraphicsViewerStageProps {
  key?: React.Key;
  project: PortfolioProject;
  phase: ViewerPlaybackState;
  reducedMotion: boolean;
  onCommercialComplete: () => void;
  onClose: () => void;
}

/**
 * Centred Compact 16:9 Rounded-Rectangle 2D Commercial Viewer on a Pure White (#FFFFFF) Canvas.
 * - Strictly confines every 2D brand background and motion sequence inside the centred 16:9 panel.
 * - Keeps the entire surrounding page pure white (#FFFFFF) at all screen sizes.
 * - Places discreet Back & Close controls outside the animation rectangle on the white canvas.
 * - Eliminates transition ghosting: fades the compact window cleanly to pure white first while the
 *   #FFFFFF backdrop remains 100% opaque, then reveals the first original mockup underneath.
 */
export function MotionGraphicsViewerStage({
  project,
  phase,
  reducedMotion,
  onCommercialComplete,
  onClose,
}: MotionGraphicsViewerStageProps) {
  const isTransitioning = phase === "transitioning";
  const [entered, setEntered] = useState(false);
  const [revealMockupVeilFade, setRevealMockupVeilFade] = useState(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      setRevealMockupVeilFade(false);
      return;
    }
    // Step 1 (0-310ms): compact 16:9 animation panel fades cleanly into the solid #FFFFFF canvas
    // Step 2 (310-520ms): once panel is gone (zero ghosting!), white canvas fades to reveal PreviewModal
    const timer = window.setTimeout(() => {
      setRevealMockupVeilFade(true);
    }, 310);
    return () => window.clearTimeout(timer);
  }, [isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const renderActive2DCommercial = () => {
    switch (project.slug) {
      case "raymond":
        return (
          <Raymond2DCommercial
            reducedMotion={reducedMotion}
            onComplete={onCommercialComplete}
          />
        );
      case "alhind-air":
        return (
          <AlhindAir2DCommercial
            reducedMotion={reducedMotion}
            onComplete={onCommercialComplete}
          />
        );
      case "paper-boat":
        return (
          <PaperBoat2DCommercial
            reducedMotion={reducedMotion}
            onComplete={onCommercialComplete}
          />
        );
      case "alcohol-zambara":
        return (
          <Zambara2DCommercial
            reducedMotion={reducedMotion}
            onComplete={onCommercialComplete}
          />
        );
      case "reva":
        return (
          <Reva2DCommercial
            reducedMotion={reducedMotion}
            onComplete={onCommercialComplete}
          />
        );
      default:
        return null;
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-testid="project-2d-motion-stage"
      data-project-slug={project.slug}
      data-stage-phase={phase}
      style={{
        backgroundColor: "#FFFFFF",
        opacity: revealMockupVeilFade ? 0 : 1,
        transition: "opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: isTransitioning ? "none" : "auto",
      }}
      className="fixed inset-0 z-[110] bg-[#FFFFFF] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Discreet Controls Outside the Animation Window on the Pure White Canvas */}
      <header
        style={{
          opacity: isTransitioning ? 0 : entered ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="w-full flex items-center justify-between px-4 sm:px-8 md:px-10 py-3.5 sm:py-5 shrink-0 z-20"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to My Work"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/90 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <ArrowLeft size={16} strokeWidth={1.9} />
          <span>Back to My Work</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Project"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/90 flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <X size={18} strokeWidth={1.9} />
        </button>
      </header>

      {/* Pure White Centering Stage Surrounding the Compact 16:9 Rounded Media Window */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center px-4 sm:px-8 md:px-12">
        <div
          data-testid="project-2d-pill-window"
          style={{
            opacity: isTransitioning ? 0 : entered ? 1 : 0,
            transform: isTransitioning
              ? "scale(0.985) translateZ(0)"
              : entered
                ? "scale(1) translateZ(0)"
                : "scale(0.982) translateZ(0)",
            transition: isTransitioning
              ? "opacity 290ms cubic-bezier(0.22, 1, 0.36, 1), transform 290ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "opacity 260ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1)",
            isolation: "isolate",
            WebkitMaskImage: "-webkit-radial-gradient(white, black)",
          }}
          className="relative w-[calc(100vw-32px)] sm:w-[74vw] lg:w-[62vw] max-w-[820px] max-h-[calc(100dvh-132px)] aspect-video rounded-[24px] sm:rounded-[28px] md:rounded-[32px] border border-zinc-200/90 shadow-[0_18px_50px_-14px_rgba(0,0,0,0.08),0_4px_14px_-4px_rgba(0,0,0,0.04)] overflow-hidden bg-white"
        >
          {renderActive2DCommercial()}
        </div>
      </main>

      {/* Equal Bottom Counterweight Spacer so the 16:9 Window Sits Dead-Centre Vertically */}
      <div
        aria-hidden="true"
        className="w-full h-[52px] sm:h-[68px] shrink-0 pointer-events-none"
      />
    </div>,
    document.body
  );
}
