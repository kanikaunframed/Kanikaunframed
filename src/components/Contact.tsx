import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Mail,
  Linkedin,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import gsap from "gsap";
import { ResumeControls } from "./ResumeControls";

interface ContactProps {
  key?: React.Key;
  setActiveSection?: (section: string) => void;
}

const SUPPORTING_PARAGRAPH =
  "Currently open to new ideas, exciting projects and interesting conversations. Have something in mind? Let's make it happen.";

const SUPPORTING_WORDS = SUPPORTING_PARAGRAPH.split(" ");

const DESIGNER_DESIGNATION = "Kanika Agrawal · Visual Communication Designer";
const EMAIL_ADDRESS = "kanikaunframed@gmail.com";
const EMAIL_HREF = `mailto:${EMAIL_ADDRESS}`;
const LINKEDIN_HANDLE = "kanika-agrawal-5abba0161";
const LINKEDIN_HREF = "https://www.linkedin.com/in/kanika-agrawal-5abba0161";

interface PixelNodeSpec {
  readonly id: string;
  readonly size: number;
  readonly startX: number;
  readonly startY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly variant: "solid" | "outlined" | "muted";
}

/**
 * 7 minimal architectural pixel squares for the closing signature animation.
 * Originate calmly near the outer edges of the composition (x = 92..548 in 640-wide SVG space),
 * glide inward into a balanced symmetrical pixel formation around center (320, 34), settle,
 * and fade smoothly as the footer enters.
 */
const CLOSING_PIXEL_SPECS: readonly PixelNodeSpec[] = [
  {
    id: "px-left-outer",
    size: 5,
    startX: 94,
    startY: 24,
    targetX: 286,
    targetY: 34,
    variant: "muted",
  },
  {
    id: "px-left-upper",
    size: 7,
    startX: 146,
    startY: 44,
    targetX: 302,
    targetY: 26,
    variant: "outlined",
  },
  {
    id: "px-left-lower",
    size: 6,
    startX: 196,
    startY: 20,
    targetX: 302,
    targetY: 42,
    variant: "solid",
  },
  {
    id: "px-center-keystone",
    size: 11,
    startX: 320,
    startY: 46,
    targetX: 320,
    targetY: 34,
    variant: "outlined",
  },
  {
    id: "px-right-upper",
    size: 6,
    startX: 444,
    startY: 46,
    targetX: 338,
    targetY: 26,
    variant: "solid",
  },
  {
    id: "px-right-lower",
    size: 7,
    startX: 494,
    startY: 22,
    targetX: 338,
    targetY: 42,
    variant: "outlined",
  },
  {
    id: "px-right-outer",
    size: 5,
    startX: 546,
    startY: 42,
    targetX: 354,
    targetY: 34,
    variant: "muted",
  },
];

export function Contact(_props: ContactProps) {
  const prefersReducedMotionHook = useReducedMotion();
  const prefersReducedMotion = Boolean(prefersReducedMotionHook);

  const [measuredLines, setMeasuredLines] = useState<string[]>([
    SUPPORTING_PARAGRAPH,
  ]);
  const [linesReady, setLinesReady] = useState<boolean>(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const heroTriggerRef = useRef<HTMLDivElement | null>(null);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const measureWordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Heading kinetic typography refs
  const designationLineRef = useRef<HTMLParagraphElement | null>(null);
  const headingLine1Ref = useRef<HTMLSpanElement | null>(null);
  const headingLine2Ref = useRef<HTMLSpanElement | null>(null);
  const fullStopRef = useRef<HTMLSpanElement | null>(null);
  const headingPixelFrameRef = useRef<HTMLSpanElement | null>(null);
  const headingPixelClusterRef = useRef<SVGSVGElement | null>(null);

  // Supporting paragraph line-by-line refs
  const paragraphContainerRef = useRef<HTMLParagraphElement | null>(null);

  // Contact cards & resume refs
  const emailCardWrapRef = useRef<HTMLDivElement | null>(null);
  const linkedinCardWrapRef = useRef<HTMLDivElement | null>(null);
  const resumeWrapRef = useRef<HTMLDivElement | null>(null);

  // Pixel-inspired closing animation refs
  const pixelClosingStageRef = useRef<HTMLDivElement | null>(null);
  const pixelClosingSvgRef = useRef<SVGSVGElement | null>(null);
  const pixelNodeGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const pixelCenterDotRef = useRef<SVGRectElement | null>(null);
  const pixelGuideLineLeftRef = useRef<SVGLineElement | null>(null);
  const pixelGuideLineRightRef = useRef<SVGLineElement | null>(null);

  // Footer reveal refs
  const footerRef = useRef<HTMLElement | null>(null);
  const footerCopyRef = useRef<HTMLParagraphElement | null>(null);

  // One-shot animation state flags so minor scrolling never replays entrance animations
  const hasPlayedHeroRef = useRef<boolean>(false);
  const hasHeroFinishedRef = useRef<boolean>(false);
  const hasPlayedClosingRef = useRef<boolean>(false);
  const hasClosingSettledRef = useRef<boolean>(false);
  const hasPlayedFooterRef = useRef<boolean>(false);
  const isFooterInViewRef = useRef<boolean>(false);
  const isClosingInViewRef = useRef<boolean>(false);

  const activeTimelinesRef = useRef<gsap.core.Timeline[]>([]);

  /**
   * Dynamically groups the exact supporting paragraph words into real visual lines
   * across Desktop, Laptop, Tablet, and Mobile viewports without character-by-character typing
   * or awkward mid-sentence hard breaks.
   */
  const computeVisualParagraphLines = useCallback(() => {
    const container = measureContainerRef.current;
    if (!container) return;

    const spans = measureWordRefs.current;
    if (!spans.length || !spans[0]) return;

    const lines: string[] = [];
    let currentWords: string[] = [];
    let currentTop: number | null = null;

    for (let i = 0; i < SUPPORTING_WORDS.length; i++) {
      const el = spans[i];
      const word = SUPPORTING_WORDS[i];
      if (!el) {
        currentWords.push(word);
        continue;
      }
      const top = el.offsetTop;
      if (currentTop === null || Math.abs(top - currentTop) <= 4) {
        if (currentTop === null) currentTop = top;
        currentWords.push(word);
      } else {
        if (currentWords.length > 0) {
          lines.push(currentWords.join(" "));
        }
        currentWords = [word];
        currentTop = top;
      }
    }
    if (currentWords.length > 0) {
      lines.push(currentWords.join(" "));
    }

    if (lines.length > 0) {
      setMeasuredLines((prev) => {
        if (
          prev.length === lines.length &&
          prev.every((line, idx) => line === lines[idx])
        ) {
          return prev;
        }
        return lines;
      });
    }
    setLinesReady(true);
  }, []);

  useLayoutEffect(() => {
    computeVisualParagraphLines();

    const measureEl = measureContainerRef.current;
    if (!measureEl || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      computeVisualParagraphLines();
    });
    ro.observe(measureEl);

    return () => {
      ro.disconnect();
    };
  }, [computeVisualParagraphLines]);

  // Ensure newly re-wrapped paragraph lines remain visible after initial hero entrance has completed
  useLayoutEffect(() => {
    if (prefersReducedMotion || hasHeroFinishedRef.current) {
      const lineNodes =
        paragraphContainerRef.current?.querySelectorAll<HTMLElement>(
          "[data-contact-para-line]"
        );
      if (lineNodes && lineNodes.length > 0) {
        gsap.set(lineNodes, {
          yPercent: 0,
          y: 0,
          opacity: 1,
          clearProps: "willChange",
        });
      }
    }
  }, [measuredLines, prefersReducedMotion]);

  // Master viewport-triggered GSAP choreography with strict cleanup
  useEffect(() => {
    if (!linesReady) return;
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const ctx = gsap.context(() => {
      const lineNodes =
        paragraphContainerRef.current?.querySelectorAll<HTMLElement>(
          "[data-contact-para-line]"
        ) ?? [];

      const cardWrapNodes = [
        emailCardWrapRef.current,
        linkedinCardWrapRef.current,
      ].filter(Boolean);

      if (prefersReducedMotion) {
        hasPlayedHeroRef.current = true;
        hasHeroFinishedRef.current = true;
        hasPlayedClosingRef.current = true;
        hasClosingSettledRef.current = true;
        hasPlayedFooterRef.current = true;

        gsap.set(
          [
            designationLineRef.current,
            headingLine1Ref.current,
            headingLine2Ref.current,
            fullStopRef.current,
            headingPixelFrameRef.current,
            headingPixelClusterRef.current,
            ...cardWrapNodes,
            resumeWrapRef.current,
            footerRef.current,
            footerCopyRef.current,
          ].filter(Boolean),
          { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1 }
        );

        if (lineNodes.length > 0) {
          gsap.set(lineNodes, { opacity: 1, y: 0, yPercent: 0 });
        }

        CLOSING_PIXEL_SPECS.forEach((spec, idx) => {
          const g = pixelNodeGroupRefs.current[idx];
          if (g) {
            gsap.set(g, {
              x: spec.targetX,
              y: spec.targetY,
              opacity: 0.28,
              scale: 1,
            });
          }
        });
        if (pixelClosingSvgRef.current) {
          gsap.set(pixelClosingSvgRef.current, { opacity: 0.45 });
        }
        return;
      }

      // -------------------------------------------------------------------
      // Initial pre-reveal states (compositor-only: transform & opacity)
      // -------------------------------------------------------------------
      gsap.set(designationLineRef.current, {
        y: 8,
        opacity: 0,
      });
      gsap.set(
        [headingLine1Ref.current, headingLine2Ref.current].filter(Boolean),
        {
          yPercent: 112,
          opacity: 0,
        }
      );
      gsap.set(fullStopRef.current, {
        scale: 0.32,
        opacity: 0,
        transformOrigin: "50% 78%",
      });
      gsap.set(headingPixelFrameRef.current, {
        opacity: 0,
        scale: 0.94,
      });
      gsap.set(headingPixelClusterRef.current, {
        opacity: 0,
        scale: 0.78,
        y: 4,
        transformOrigin: "50% 50%",
      });

      if (lineNodes.length > 0) {
        gsap.set(lineNodes, {
          yPercent: 105,
          opacity: 0,
        });
      }

      gsap.set([...cardWrapNodes, resumeWrapRef.current].filter(Boolean), {
        y: 18,
        opacity: 0,
      });

      CLOSING_PIXEL_SPECS.forEach((spec, idx) => {
        const g = pixelNodeGroupRefs.current[idx];
        if (g) {
          gsap.set(g, {
            x: spec.startX,
            y: spec.startY,
            opacity: 0,
            scale: 0.72,
          });
        }
      });
      gsap.set(pixelCenterDotRef.current, {
        opacity: 0,
        scale: 0.4,
        transformOrigin: "50% 50%",
      });
      gsap.set(
        [pixelGuideLineLeftRef.current, pixelGuideLineRightRef.current].filter(
          Boolean
        ),
        {
          opacity: 0,
          scaleX: 0,
        }
      );
      gsap.set(pixelClosingSvgRef.current, { opacity: 1, y: 0 });

      gsap.set(footerRef.current, { opacity: 0, y: 14 });
      gsap.set(footerCopyRef.current, { opacity: 0, y: 10 });

      // -------------------------------------------------------------------
      // Sequence C: Footer Reveal (400–700 ms) + Smooth Pixel Closing Fade-Out
      // -------------------------------------------------------------------
      const playFooterReveal = () => {
        if (hasPlayedFooterRef.current) return;
        hasPlayedFooterRef.current = true;

        const tlFooter = gsap.timeline();
        activeTimelinesRef.current.push(tlFooter);

        if (pixelClosingSvgRef.current) {
          tlFooter.to(
            pixelClosingSvgRef.current,
            {
              opacity: 0,
              y: -4,
              duration: 0.52,
              ease: "power2.inOut",
            },
            0
          );
        }

        tlFooter.to(
          footerRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.56,
            ease: "power3.out",
          },
          0.06
        );

        tlFooter.to(
          footerCopyRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.48,
            ease: "power3.out",
          },
          0.12
        );
      };

      // -------------------------------------------------------------------
      // Sequence B: Pixel-Inspired Closing Animation (600–1000 ms)
      // -------------------------------------------------------------------
      const playPixelClosingSequence = () => {
        if (hasPlayedClosingRef.current) return;
        hasPlayedClosingRef.current = true;

        const tlClosing = gsap.timeline({
          onComplete: () => {
            hasClosingSettledRef.current = true;
            if (isFooterInViewRef.current) {
              playFooterReveal();
            }
          },
        });
        activeTimelinesRef.current.push(tlClosing);

        const nodes = pixelNodeGroupRefs.current.filter(Boolean);

        tlClosing.to(
          nodes,
          {
            opacity: 0.9,
            scale: 1,
            duration: 0.22,
            stagger: { each: 0.025, from: "edges" },
            ease: "power2.out",
          },
          0
        );

        CLOSING_PIXEL_SPECS.forEach((spec, idx) => {
          const g = pixelNodeGroupRefs.current[idx];
          if (!g) return;
          const distDelay = Math.abs(idx - 3) * 0.03;
          tlClosing.to(
            g,
            {
              x: spec.targetX,
              y: spec.targetY,
              duration: 0.78,
              ease: "expo.out",
            },
            0.08 + distDelay
          );
        });

        tlClosing.to(
          [pixelGuideLineLeftRef.current, pixelGuideLineRightRef.current].filter(
            Boolean
          ),
          {
            opacity: 0.55,
            scaleX: 1,
            duration: 0.42,
            ease: "power2.out",
          },
          0.38
        );

        tlClosing.to(
          pixelCenterDotRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.28,
            ease: "power2.out",
          },
          0.54
        );

        tlClosing.to({}, { duration: 0.28 });
      };

      // -------------------------------------------------------------------
      // Sequence A: Main Heading + Supporting Copy + Contact Cards + Resume
      // -------------------------------------------------------------------
      const playHeroEntranceSequence = () => {
        if (hasPlayedHeroRef.current) return;
        hasPlayedHeroRef.current = true;

        const currentLineNodes =
          paragraphContainerRef.current?.querySelectorAll<HTMLElement>(
            "[data-contact-para-line]"
          ) ?? [];

        const tlHero = gsap.timeline({
          onComplete: () => {
            hasHeroFinishedRef.current = true;
            if (isClosingInViewRef.current || isFooterInViewRef.current) {
              playPixelClosingSequence();
            }
          },
        });
        activeTimelinesRef.current.push(tlHero);

        tlHero.to(
          designationLineRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.42,
            ease: "power3.out",
          },
          0
        );

        tlHero.to(
          headingLine1Ref.current,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.76,
            ease: "power4.out",
          },
          0.06
        );

        tlHero.to(
          headingLine2Ref.current,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.76,
            ease: "power4.out",
          },
          0.175
        );

        tlHero.to(
          fullStopRef.current,
          {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.35)",
          },
          0.56
        );

        tlHero.to(
          headingPixelFrameRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.34,
            ease: "power2.out",
          },
          0.52
        );

        tlHero.to(
          headingPixelClusterRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.36,
            ease: "power3.out",
          },
          0.6
        );

        if (currentLineNodes.length > 0) {
          tlHero.to(
            currentLineNodes,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.56,
              stagger: 0.105,
              ease: "power3.out",
            },
            0.34
          );
        }

        if (cardWrapNodes.length > 0) {
          tlHero.to(
            cardWrapNodes,
            {
              y: 0,
              opacity: 1,
              duration: 0.42,
              stagger: 0.08,
              ease: "power3.out",
            },
            0.5
          );
        }

        tlHero.to(
          resumeWrapRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.42,
            ease: "power3.out",
          },
          0.78
        );
      };

      if (typeof IntersectionObserver === "undefined") {
        isClosingInViewRef.current = true;
        isFooterInViewRef.current = true;
        playHeroEntranceSequence();
        return;
      }

      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playHeroEntranceSequence();
              heroObserver.disconnect();
            }
          });
        },
        { root: sectionEl, threshold: 0.12 }
      );

      const closingObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isClosingInViewRef.current = entry.isIntersecting;
            if (entry.isIntersecting && hasHeroFinishedRef.current) {
              playPixelClosingSequence();
              closingObserver.disconnect();
            }
          });
        },
        { root: sectionEl, threshold: 0.25 }
      );

      const footerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isFooterInViewRef.current = entry.isIntersecting;
            if (entry.isIntersecting) {
              if (hasClosingSettledRef.current) {
                playFooterReveal();
                footerObserver.disconnect();
              } else if (
                hasHeroFinishedRef.current &&
                !hasPlayedClosingRef.current
              ) {
                playPixelClosingSequence();
              }
            }
          });
        },
        { root: sectionEl, threshold: 0.15 }
      );

      if (heroTriggerRef.current) heroObserver.observe(heroTriggerRef.current);
      if (pixelClosingStageRef.current) {
        closingObserver.observe(pixelClosingStageRef.current);
      }
      if (footerRef.current) footerObserver.observe(footerRef.current);

      return () => {
        heroObserver.disconnect();
        closingObserver.disconnect();
        footerObserver.disconnect();
      };
    }, sectionEl);

    return () => {
      activeTimelinesRef.current.forEach((tl) => tl.kill());
      activeTimelinesRef.current = [];
      ctx.revert();
    };
  }, [linesReady, prefersReducedMotion]);

  return (
    <motion.section
      ref={sectionRef}
      data-testid="contact-section"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
      className="absolute inset-0 flex flex-col p-4 sm:p-6 md:p-8 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col justify-between flex-1 pt-6 sm:pt-8 md:pt-10 pb-10 sm:pb-14 min-h-min">
        <div ref={heroTriggerRef} className="my-auto">
          {/* 1. Signature Kinetic Typography Heading + Supporting Line-by-Line Copy */}
          <div className="mb-8 md:mb-10">
            <p
              ref={designationLineRef}
              style={{ willChange: "transform, opacity" }}
              className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 mb-3 sm:mb-4"
            >
              {DESIGNER_DESIGNATION}
            </p>

            <div className="relative inline-block max-w-full">
              {/* Subtle Pixel-Inspired Graphic Cluster poised at the upper-right of the heading */}
              <svg
                ref={headingPixelClusterRef}
                aria-hidden="true"
                viewBox="0 0 28 22"
                className="pointer-events-none select-none w-5 h-4 sm:w-6 sm:h-5 md:w-7 md:h-[22px] absolute -top-3.5 -right-3 sm:-top-4 sm:-right-5 md:-right-7"
              >
                <rect
                  x="2"
                  y="11"
                  width="6"
                  height="6"
                  fill="#FAF9F6"
                  stroke="#71717A"
                  strokeWidth="1.2"
                />
                <rect x="11" y="4" width="6.5" height="6.5" fill="#18181B" />
                <rect x="20" y="12" width="4" height="4" fill="#A1A1AA" />
              </svg>

              <h2
                aria-label="A Pixel Away From Hello."
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 mb-5 leading-[1.12] text-balance"
              >
                {/* Heading Line 1 Mask */}
                <span className="block overflow-hidden pb-1 pt-1.5">
                  <span
                    ref={headingLine1Ref}
                    style={{ willChange: "transform, opacity" }}
                    className="inline-block"
                  >
                    A{" "}
                    <span className="relative inline-block px-1 -mx-0.5">
                      <span>Pixel</span>
                      <span
                        ref={headingPixelFrameRef}
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-[0.12em] bottom-[0.06em]"
                      >
                        <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border border-zinc-400/80 bg-[#FAF9F6]" />
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 border border-zinc-400/80 bg-[#FAF9F6]" />
                        <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border border-zinc-400/80 bg-[#FAF9F6]" />
                        <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-zinc-900" />
                      </span>
                    </span>{" "}
                    Away{" "}
                  </span>
                </span>

                {/* Heading Line 2 Mask + Dedicated Full Stop Reveal */}
                <span className="block overflow-hidden pb-1.5">
                  <span
                    ref={headingLine2Ref}
                    style={{ willChange: "transform, opacity" }}
                    className="inline-block"
                  >
                    From{" "}
                    <span className="text-zinc-400 font-light italic">
                      Hello
                    </span>
                    <span
                      ref={fullStopRef}
                      data-testid="heading-full-stop"
                      style={{ willChange: "transform, opacity" }}
                      className="inline-block text-zinc-400 font-light italic ml-[0.01em]"
                    >
                      .
                    </span>
                  </span>
                </span>
              </h2>
            </div>

            {/* Hidden Responsive Line-Break Measurement Mirror (Zero Layout Shift) */}
            <div className="relative max-w-2xl mx-auto">
              <div
                ref={measureContainerRef}
                aria-hidden="true"
                className="invisible pointer-events-none select-none absolute inset-x-0 top-0 h-0 overflow-hidden text-base sm:text-lg md:text-xl font-light leading-relaxed"
              >
                {SUPPORTING_WORDS.map((word, idx) => (
                  <React.Fragment key={`${word}-${idx}`}>
                    <span
                      ref={(el) => {
                        measureWordRefs.current[idx] = el;
                      }}
                      className="inline-block"
                    >
                      {word}
                    </span>
                    {idx < SUPPORTING_WORDS.length - 1 ? " " : ""}
                  </React.Fragment>
                ))}
              </div>

              {/* Visible Line-by-Line Masked Supporting Paragraph */}
              <p
                ref={paragraphContainerRef}
                aria-label={SUPPORTING_PARAGRAPH}
                className={`text-base sm:text-lg md:text-xl text-zinc-500 font-light max-w-2xl mx-auto leading-relaxed ${
                  !linesReady && !prefersReducedMotion ? "opacity-0" : ""
                }`}
              >
                {measuredLines.map((line, idx) => (
                  <span
                    key={`line-${idx}`}
                    className="block overflow-hidden pb-1 -mb-1"
                  >
                    <span
                      data-contact-para-line
                      style={{ willChange: "transform, opacity" }}
                      className="block"
                    >
                      {line}
                      {idx < measuredLines.length - 1 ? " " : ""}
                    </span>
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Interactive Contact Cards — Balanced Two-Column Layout (Email + LinkedIn) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-5 sm:gap-6 lg:gap-8 w-full text-left max-w-xl lg:max-w-4xl mx-auto mb-9 md:mb-11">
            {/* Left Column: Email Address */}
            <div
              ref={emailCardWrapRef}
              style={{ willChange: "transform, opacity" }}
              className="h-full"
            >
              <a
                href={EMAIL_HREF}
                data-testid="contact-email-link"
                aria-label={`Send email to ${EMAIL_ADDRESS}`}
                className="group h-full min-h-[84px] flex items-center justify-between p-5 sm:p-6 bg-white/55 backdrop-blur-xl border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-[2rem] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.065)] hover:bg-white hover:border-black/12 active:translate-y-0 active:scale-[0.992] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
                  <div className="shrink-0 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white flex items-center justify-center border border-zinc-100 shadow-sm transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:scale-[1.03] group-focus-visible:bg-zinc-900 group-focus-visible:border-zinc-900">
                    <Mail
                      size={20}
                      className="text-zinc-700 group-hover:text-white group-focus-visible:text-white transition-colors duration-300"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400 group-hover:text-zinc-500 transition-colors duration-300 uppercase tracking-widest mb-0.5">
                      Email
                    </p>
                    <p className="text-[13px] sm:text-base lg:text-[15px] xl:text-base font-medium text-zinc-800 group-hover:text-zinc-950 group-focus-visible:text-zinc-950 transition-colors duration-300 truncate">
                      <span className="relative inline-block max-w-full pb-0.5 truncate align-bottom">
                        <span>{EMAIL_ADDRESS}</span>
                        <span
                          aria-hidden="true"
                          data-testid="email-hover-underline"
                          className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1.5px] bg-zinc-950 origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      </span>
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={19}
                  aria-hidden="true"
                  className="shrink-0 text-zinc-400 group-hover:text-zinc-950 group-focus-visible:text-zinc-950 transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5"
                />
              </a>
            </div>

            {/* Right Column: LinkedIn Social Link */}
            <div
              ref={linkedinCardWrapRef}
              style={{ willChange: "transform, opacity" }}
              className="h-full"
            >
              <a
                href={LINKEDIN_HREF}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-linkedin-link"
                aria-label="Visit Kanika Agrawal on LinkedIn"
                className="group h-full min-h-[84px] flex items-center justify-between p-5 sm:p-6 bg-white/55 backdrop-blur-xl border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-[2rem] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.065)] hover:bg-white hover:border-black/12 active:translate-y-0 active:scale-[0.992] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
                  <div className="shrink-0 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white flex items-center justify-center border border-zinc-100 shadow-sm transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:scale-[1.03] group-focus-visible:bg-zinc-900 group-focus-visible:border-zinc-900">
                    <Linkedin
                      size={20}
                      className="text-zinc-700 group-hover:text-white group-focus-visible:text-white transition-colors duration-300"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400 group-hover:text-zinc-500 transition-colors duration-300 uppercase tracking-widest mb-0.5">
                      LinkedIn
                    </p>
                    <p className="text-[13px] sm:text-base lg:text-[15px] xl:text-base font-medium text-zinc-800 group-hover:text-zinc-950 group-focus-visible:text-zinc-950 transition-colors duration-300 truncate">
                      <span className="relative inline-block max-w-full pb-0.5 truncate align-bottom">
                        <span>{LINKEDIN_HANDLE}</span>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 right-0 bottom-0 h-[1.5px] bg-zinc-950 origin-left scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      </span>
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={19}
                  aria-hidden="true"
                  className="shrink-0 text-zinc-400 group-hover:text-zinc-950 group-focus-visible:text-zinc-950 transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5 group-focus-visible:translate-x-1 group-focus-visible:-translate-y-0.5"
                />
              </a>
            </div>
          </div>

          {/* Resume View & Download Controls (Identical Resume File as About Me) */}
          <div
            ref={resumeWrapRef}
            style={{ willChange: "transform, opacity" }}
            className="flex flex-col items-center justify-center mb-6 sm:mb-8"
          >
            <ResumeControls className="justify-center" />
          </div>
        </div>

        {/* Pixel-Inspired Closing Signature + Footer Reveal */}
        <div className="w-full max-w-4xl mx-auto mt-2">
          <div
            ref={pixelClosingStageRef}
            data-testid="pixel-closing-animation"
            aria-hidden="true"
            className="w-full flex items-center justify-center h-12 sm:h-14 overflow-hidden pointer-events-none select-none"
          >
            <svg
              ref={pixelClosingSvgRef}
              viewBox="0 0 640 68"
              className="w-full max-w-xl h-full overflow-visible block"
            >
              <line
                ref={pixelGuideLineLeftRef}
                x1="232"
                y1="34"
                x2="276"
                y2="34"
                stroke="#D4D4D8"
                strokeWidth="1"
                style={{ transformOrigin: "276px 34px" }}
              />
              <line
                ref={pixelGuideLineRightRef}
                x1="364"
                y1="34"
                x2="408"
                y2="34"
                stroke="#D4D4D8"
                strokeWidth="1"
                style={{ transformOrigin: "364px 34px" }}
              />

              {CLOSING_PIXEL_SPECS.map((spec, idx) => {
                const half = spec.size / 2;
                const isSolid = spec.variant === "solid";
                const isMuted = spec.variant === "muted";
                return (
                  <g
                    key={spec.id}
                    ref={(el) => {
                      pixelNodeGroupRefs.current[idx] = el;
                    }}
                  >
                    <rect
                      x={-half}
                      y={-half}
                      width={spec.size}
                      height={spec.size}
                      fill={
                        isSolid ? "#18181B" : isMuted ? "#A1A1AA" : "#FAF9F6"
                      }
                      stroke={isOutlinedVariant(spec.variant) ? "#18181B" : "none"}
                      strokeWidth={spec.id === "px-center-keystone" ? 1.4 : 1.15}
                    />
                    {spec.id === "px-center-keystone" && (
                      <rect
                        ref={pixelCenterDotRef}
                        x={-1.5}
                        y={-1.5}
                        width={3}
                        height={3}
                        fill="#18181B"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <footer
            ref={footerRef}
            data-testid="contact-footer"
            style={{ willChange: "transform, opacity" }}
            className="flex items-center justify-center border-t border-zinc-200/60 pt-5 sm:pt-6 w-full max-w-4xl mx-auto"
          >
            <p
              ref={footerCopyRef}
              className="text-xs text-zinc-500 font-medium tracking-wide text-center"
            >
              © {new Date().getFullYear()} Kanika Agrawal. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </motion.section>
  );
}

function isOutlinedVariant(variant: PixelNodeSpec["variant"]): boolean {
  return variant === "outlined";
}
