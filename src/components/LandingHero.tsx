import React, { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const PROFILE_PIC_FALLBACK = encodeURI("/profile pic.jpeg");
const PROFILE_PIC_CARD_WEBP = "/optimized/card/profile-pic.webp";
const PROFILE_PIC_FULL_WEBP = "/optimized/full/profile-pic.webp";

const CTA_LABEL = "Explore Portfolio";
const CTA_CHARACTERS = Array.from(CTA_LABEL);

// Symmetrically centred lockup inside 1200 x 152 SVG coordinate space
// Final KANIKA box: x = 38 .. 512 (width 474) | Final AGRAWAL box: x = 558 .. 1162 (width 604)
// Left margin = 38, Right margin = 38 (1200 - 1162 = 38) -> Exact horizontal centre = 600
const KANIKA_GLYPHS = [
  { char: "K", initialX: 79, finalX: 79 },
  { char: "A", initialX: 158, finalX: 163 },
  { char: "N", initialX: 239, finalX: 249 },
  { char: "I", initialX: 308, finalX: 323 },
  { char: "K", initialX: 363, finalX: 383 },
  { char: "A", initialX: 442, finalX: 467 },
];

const AGRAWAL_GLYPHS = [
  { char: "A", x: 601, clickX: 594, clickY: 86 },
  { char: "G", x: 687, clickX: 662, clickY: 78 },
  { char: "R", x: 775, clickX: 756, clickY: 74 },
  { char: "A", x: 859, clickX: 852, clickY: 86 },
  { char: "W", x: 955, clickX: 955, clickY: 78 },
  { char: "A", x: 1051, clickX: 1044, clickY: 86 },
  { char: "L", x: 1125, clickX: 1112, clickY: 92 },
];

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const POINTER_MOVE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VECTOR_DRAG_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const CURTAIN_EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

interface CursorState {
  visible: boolean;
  x: number;
  y: number;
  clicking: boolean;
  duration: number;
  useDragEase: boolean;
}

interface PaintBucketState {
  visible: boolean;
  x: number;
  y: number;
  pouring: boolean;
  duration: number;
}

interface SelectionFrameProps {
  key?: React.Key;
  x: number;
  y: number;
  width: number;
  height: number;
  activeEastHandle?: boolean;
  transitionDuration: number;
  useDragEase: boolean;
}

function VectorSelectionFrame({
  x,
  y,
  width,
  height,
  activeEastHandle = false,
  transitionDuration,
  useDragEase,
}: SelectionFrameProps) {
  const handleSize = 6.5;
  const half = handleSize / 2;
  const midX = x + width / 2;
  const midY = y + height / 2;
  const right = x + width;
  const bottom = y + height;

  const easeCurve = useDragEase ? VECTOR_DRAG_EASE : POINTER_MOVE_EASE;

  const handles = [
    { id: "nw", hx: x, hy: y, active: false },
    { id: "n", hx: midX, hy: y, active: false },
    { id: "ne", hx: right, hy: y, active: false },
    { id: "e", hx: right, hy: midY, active: activeEastHandle },
    { id: "se", hx: right, hy: bottom, active: false },
    { id: "s", hx: midX, hy: bottom, active: false },
    { id: "sw", hx: x, hy: bottom, active: false },
    { id: "w", hx: x, hy: midY, active: false },
  ];

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EDITORIAL_EASE }}
    >
      {/* Crisp 1px Neutral Grey Vector Selection Bounding Box */}
      <motion.rect
        initial={false}
        animate={{ x, y, width, height }}
        transition={{ duration: transitionDuration, ease: easeCurve }}
        fill="none"
        stroke="#71717A"
        strokeOpacity="0.72"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* 8 Corner & Midpoint Square Anchor Points */}
      {handles.map((handle) => (
        <motion.rect
          key={handle.id}
          initial={false}
          animate={{
            x: handle.hx - half,
            y: handle.hy - half,
          }}
          transition={{ duration: transitionDuration, ease: easeCurve }}
          width={handleSize}
          height={handleSize}
          fill={handle.active ? "#18181B" : "#FAF9F6"}
          stroke={handle.active ? "#18181B" : "#52525B"}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </motion.g>
  );
}

interface LandingHeroProps {
  key?: React.Key;
  onExplore: () => void;
}

export function LandingHero({ onExplore }: LandingHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  // Typography vector-editing & Paint Bucket fill stages
  const [typographyPlaced, setTypographyPlaced] = useState<boolean>(() =>
    Boolean(prefersReducedMotion)
  );
  const [selectedWord, setSelectedWord] = useState<"kanika" | null>(null);
  const [activeEastHandle, setActiveEastHandle] = useState<boolean>(false);
  const [kanikaAdjusted, setKanikaAdjusted] = useState<boolean>(() =>
    Boolean(prefersReducedMotion)
  );
  const [filledLetters, setFilledLetters] = useState<boolean[]>(() =>
    AGRAWAL_GLYPHS.map(() => Boolean(prefersReducedMotion))
  );
  const [activePaintClickIdx, setActivePaintClickIdx] = useState<number | null>(
    null
  );
  const [titleEmphasis, setTitleEmphasis] = useState<boolean>(false);

  // Selection pointer state (KANIKA adjustment)
  const [cursor, setCursor] = useState<CursorState>({
    visible: false,
    x: 168,
    y: 148,
    clicking: false,
    duration: 0.55,
    useDragEase: false,
  });

  // Live Paint Bucket cursor state (AGRAWAL letter-by-letter fill)
  const [paintBucket, setPaintBucket] = useState<PaintBucketState>({
    visible: false,
    x: 554,
    y: 144,
    pouring: false,
    duration: 0.42,
  });

  // Portrait & Explore Portfolio CTA states
  const [portraitVisible, setPortraitVisible] = useState<boolean>(() =>
    Boolean(prefersReducedMotion)
  );
  const [buttonVisible, setButtonVisible] = useState<boolean>(() =>
    Boolean(prefersReducedMotion)
  );
  const [typingLineVisible, setTypingLineVisible] = useState<boolean>(false);
  const [typedCount, setTypedCount] = useState<number>(() =>
    prefersReducedMotion ? CTA_CHARACTERS.length : 0
  );
  const [arrowVisible, setArrowVisible] = useState<boolean>(() =>
    Boolean(prefersReducedMotion)
  );
  const [buttonEmphasis, setButtonEmphasis] = useState<boolean>(false);

  const hasTriggeredExitRef = useRef(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 640);
    };
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const triggerSeamlessExit = useCallback(() => {
    if (hasTriggeredExitRef.current) return;
    hasTriggeredExitRef.current = true;
    onExplore();
  }, [onExplore]);

  // Orchestrate full timeline:
  // 1. Outlined typography placement -> 2. KANIKA vector selection ->
  // 3. Paint Bucket cursor enters & fills AGRAWAL letter by letter (A-G-R-A-W-A-L) ->
  // 4. Paint Bucket exits & title settles -> 5. Portrait reveal -> 6. Explore Portfolio -> CTA
  useEffect(() => {
    if (prefersReducedMotion) {
      setTypographyPlaced(true);
      setSelectedWord(null);
      setActiveEastHandle(false);
      setKanikaAdjusted(true);
      setFilledLetters(AGRAWAL_GLYPHS.map(() => true));
      setActivePaintClickIdx(null);
      setTitleEmphasis(false);
      setCursor((prev) => ({ ...prev, visible: false }));
      setPaintBucket((prev) => ({ ...prev, visible: false }));
      setPortraitVisible(true);
      setButtonVisible(true);
      setTypingLineVisible(false);
      setTypedCount(CTA_CHARACTERS.length);
      setArrowVisible(true);
      setButtonEmphasis(false);
      return;
    }

    const timers: number[] = [];
    let typingInterval: number | null = null;

    // Stage 1 (0.22s): KANIKA and AGRAWAL appear in geometric outlined typography
    timers.push(
      window.setTimeout(() => {
        setTypographyPlaced(true);
      }, 220)
    );

    // Stage 2 (0.88s): Vector selection pointer enters towards KANIKA
    timers.push(
      window.setTimeout(() => {
        setCursor({
          visible: true,
          x: 285,
          y: 78,
          clicking: false,
          duration: 0.54,
          useDragEase: false,
        });
      }, 880)
    );

    // Stage 3a (1.44s): Select KANIKA
    timers.push(
      window.setTimeout(() => {
        setCursor((prev) => ({ ...prev, clicking: true }));
        setSelectedWord("kanika");
      }, 1440)
    );

    timers.push(
      window.setTimeout(() => {
        setCursor((prev) => ({ ...prev, clicking: false }));
      }, 1570)
    );

    // Stage 3b (1.66s): Move pointer to KANIKA right-midpoint handle
    timers.push(
      window.setTimeout(() => {
        setCursor({
          visible: true,
          x: 487,
          y: 74,
          clicking: false,
          duration: 0.42,
          useDragEase: false,
        });
      }, 1660)
    );

    timers.push(
      window.setTimeout(() => {
        setActiveEastHandle(true);
      }, 2080)
    );

    // Stage 3c (2.12s): Refine KANIKA spacing & outline crispness
    timers.push(
      window.setTimeout(() => {
        setKanikaAdjusted(true);
        setCursor({
          visible: true,
          x: 512,
          y: 74,
          clicking: false,
          duration: 0.58,
          useDragEase: true,
        });
      }, 2120)
    );

    // Release KANIKA & fade selection pointer out cleanly (2.74s)
    timers.push(
      window.setTimeout(() => {
        setActiveEastHandle(false);
        setSelectedWord(null);
        setCursor({
          visible: false,
          x: 530,
          y: 128,
          clicking: false,
          duration: 0.34,
          useDragEase: false,
        });
      }, 2740)
    );

    // Stage 4a (2.72s): Paint Bucket cursor enters smoothly towards first letter 'A' of AGRAWAL
    timers.push(
      window.setTimeout(() => {
        setPaintBucket({
          visible: true,
          x: AGRAWAL_GLYPHS[0].clickX,
          y: AGRAWAL_GLYPHS[0].clickY,
          pouring: false,
          duration: 0.42,
        });
      }, 2720)
    );

    // Stage 4b (3.16s -> 4.66s): Click & progressively fill A, G, R, A, W, A, L
    const firstClickTime = 3160;
    const stepMs = 250;

    AGRAWAL_GLYPHS.forEach((glyph, idx) => {
      const clickAt = firstClickTime + idx * stepMs;

      // Glide smoothly to the next letter prior to clicking (for G, R, A, W, A, L)
      if (idx > 0) {
        timers.push(
          window.setTimeout(() => {
            setPaintBucket({
              visible: true,
              x: glyph.clickX,
              y: glyph.clickY,
              pouring: false,
              duration: 0.16,
            });
          }, clickAt - 165)
        );
      }

      // Click & trigger organic black paint spread inside this letter's clipped boundary
      timers.push(
        window.setTimeout(() => {
          setPaintBucket((prev) => ({
            ...prev,
            x: glyph.clickX,
            y: glyph.clickY,
            pouring: true,
          }));
          setActivePaintClickIdx(idx);
          setFilledLetters((prev) => {
            const next = [...prev];
            next[idx] = true;
            return next;
          });
        }, clickAt)
      );

      // Settle pour tilt shortly after click
      timers.push(
        window.setTimeout(() => {
          setPaintBucket((prev) => ({ ...prev, pouring: false }));
        }, clickAt + 115)
      );
    });

    // Stage 5 (4.94s): All letters filled — Paint Bucket moves away and disappears
    const bucketExitTime = firstClickTime + (AGRAWAL_GLYPHS.length - 1) * stepMs + 280;
    timers.push(
      window.setTimeout(() => {
        setActivePaintClickIdx(null);
        setPaintBucket({
          visible: false,
          x: 1176,
          y: 138,
          pouring: false,
          duration: 0.42,
        });
      }, bucketExitTime)
    );

    // Stage 6 (5.04s): Subtle final emphasis as finished typography settles
    timers.push(
      window.setTimeout(() => {
        setTitleEmphasis(true);
      }, bucketExitTime + 100)
    );

    // Stage 7 (5.16s): Large centred black-and-white photograph reveals smoothly
    timers.push(
      window.setTimeout(() => {
        setPortraitVisible(true);
      }, bucketExitTime + 220)
    );

    // Stage 8 (6.10s): Reveal Explore Portfolio -> CTA after title & portrait complete
    timers.push(
      window.setTimeout(() => {
        setButtonVisible(true);
      }, bucketExitTime + 1160)
    );

    timers.push(
      window.setTimeout(() => {
        setTypingLineVisible(true);
      }, bucketExitTime + 1400)
    );

    // Character-by-character reveal of "Explore Portfolio" -> slide in arrow -> final settle
    timers.push(
      window.setTimeout(() => {
        let current = 0;
        typingInterval = window.setInterval(() => {
          current += 1;
          setTypedCount(current);

          if (current >= CTA_CHARACTERS.length) {
            if (typingInterval !== null) {
              window.clearInterval(typingInterval);
              typingInterval = null;
            }

            timers.push(
              window.setTimeout(() => {
                setTypingLineVisible(false);
                setArrowVisible(true);
              }, 110)
            );

            timers.push(
              window.setTimeout(() => {
                setButtonEmphasis(true);
              }, 360)
            );
          }
        }, 52);
      }, bucketExitTime + 1540)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      if (typingInterval !== null) {
        window.clearInterval(typingInterval);
      }
    };
  }, [prefersReducedMotion]);

  // Selection frame geometry synced to KANIKA state
  const kanikaBoxWidth = kanikaAdjusted ? 474 : 449;

  return (
    <motion.div
      role="region"
      aria-label="Kanika Agrawal Portfolio Introduction"
      initial={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0, transition: { duration: 0.22 } }
          : {
              clipPath: "inset(0% 0% 100% 0%)",
              transition: { duration: 0.72, ease: CURTAIN_EASE },
            }
      }
      style={{ willChange: "clip-path, opacity" }}
      className="absolute inset-0 h-screen h-[100dvh] w-full z-[200] bg-[#F4F3EF] overflow-hidden overscroll-none select-none"
    >
      <div className="h-full w-full flex items-center justify-center p-3 sm:p-4 md:p-5 box-border overflow-hidden">
        {/* Clean Inset Rounded Editorial Artboard */}
        <motion.div
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.992 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  y: -28,
                  scale: 0.985,
                  transition: { duration: 0.68, ease: CURTAIN_EASE },
                }
          }
          transition={{ duration: 0.5, ease: EDITORIAL_EASE }}
          style={{ willChange: "transform, opacity" }}
          className="relative w-full max-w-[1380px] h-full bg-[#FAF9F6] border border-[#E4E3DD] rounded-[24px] sm:rounded-[32px] md:rounded-[40px] flex flex-col items-center justify-center px-5 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-5 md:py-6 overflow-hidden box-border"
        >
          <h1 className="sr-only">KANIKA AGRAWAL</h1>

          {/* 1. Top Editorial Typography Lockup + Temporary Vector-Editing Sequence */}
          <motion.div
            animate={
              titleEmphasis && !prefersReducedMotion
                ? { scale: [1, 1.008, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.48, ease: POINTER_MOVE_EASE }}
            className="w-full max-w-[min(1060px,138dvh)] mx-auto px-1 shrink-0"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1200 148"
              className="w-full h-auto overflow-visible block"
            >
              <defs>
                <filter
                  id="vector-pointer-shadow"
                  x="-35%"
                  y="-30%"
                  width="190%"
                  height="190%"
                >
                  <feDropShadow
                    dx="0"
                    dy="1.5"
                    stdDeviation="1.4"
                    floodColor="#000000"
                    floodOpacity="0.2"
                  />
                </filter>

                {/* Exact Glyph Interior Clipping Masks for AGRAWAL Paint-Bucket Fill */}
                {AGRAWAL_GLYPHS.map((glyph, idx) => (
                  <clipPath
                    key={`agrawal-clip-${idx}`}
                    id={`agrawal-glyph-clip-${idx}`}
                  >
                    <text
                      x={glyph.x}
                      y="114"
                      textAnchor="middle"
                      fontFamily='"Outfit", "Inter", sans-serif'
                      fontWeight="800"
                      fontSize="108"
                      style={{
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        fontWeight: 800,
                        fontSize: "108px",
                      }}
                    >
                      {glyph.char}
                    </text>
                  </clipPath>
                ))}
              </defs>

              {/* KANIKA — Geometric Outlined Lettering with Transparent Interiors */}
              <g>
                {KANIKA_GLYPHS.map((glyph, idx) => (
                  <motion.text
                    key={`kanika-${idx}`}
                    y="114"
                    textAnchor="middle"
                    fill="transparent"
                    stroke="#111111"
                    strokeLinejoin="round"
                    style={{
                      fontFamily: '"Outfit", "Inter", sans-serif',
                      fontWeight: 800,
                      fontSize: "108px",
                    }}
                    initial={
                      prefersReducedMotion
                        ? {
                            x: glyph.finalX,
                            opacity: 1,
                            strokeOpacity: 1,
                            strokeWidth: 2.15,
                            strokeDashoffset: 0,
                          }
                        : {
                            x: glyph.initialX,
                            opacity: 0,
                            strokeOpacity: 0.4,
                            strokeWidth: 1.45,
                            strokeDasharray: 430,
                            strokeDashoffset: 170,
                          }
                    }
                    animate={
                      !typographyPlaced
                        ? {
                            x: glyph.initialX,
                            opacity: 0,
                            strokeOpacity: 0.4,
                            strokeWidth: 1.45,
                            strokeDashoffset: 170,
                          }
                        : kanikaAdjusted
                          ? {
                              x: glyph.finalX,
                              opacity: 1,
                              strokeOpacity: 1,
                              strokeWidth: 2.15,
                              strokeDashoffset: 0,
                            }
                          : {
                              x: glyph.initialX,
                              opacity: 1,
                              strokeOpacity: 0.44,
                              strokeWidth: 1.5,
                              strokeDashoffset: 0,
                            }
                    }
                    transition={{
                      x: {
                        duration: 0.62,
                        ease: VECTOR_DRAG_EASE,
                      },
                      opacity: {
                        duration: 0.42,
                        delay: typographyPlaced && !kanikaAdjusted ? idx * 0.035 : 0,
                        ease: EDITORIAL_EASE,
                      },
                      strokeDashoffset: {
                        duration: 0.58,
                        delay: typographyPlaced && !kanikaAdjusted ? idx * 0.035 : 0,
                        ease: EDITORIAL_EASE,
                      },
                      strokeOpacity: {
                        duration: 0.55,
                        ease: EDITORIAL_EASE,
                      },
                      strokeWidth: {
                        duration: 0.55,
                        ease: EDITORIAL_EASE,
                      },
                    }}
                  >
                    {glyph.char}
                  </motion.text>
                ))}

                {/* Subtle Vector Outline Anchor Micro-Details on KANIKA While Selected */}
                <AnimatePresence>
                  {selectedWord === "kanika" && !prefersReducedMotion && (
                    <motion.g
                      key="kanika-outline-nodes"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <motion.line
                        initial={false}
                        animate={{
                          x1: 48,
                          x2: kanikaAdjusted ? 500 : 475,
                        }}
                        transition={{ duration: 0.62, ease: VECTOR_DRAG_EASE }}
                        y1="114"
                        y2="114"
                        stroke="#71717A"
                        strokeOpacity="0.35"
                        strokeWidth="0.75"
                        vectorEffect="non-scaling-stroke"
                      />
                      {KANIKA_GLYPHS.map((glyph, idx) => {
                        const gx = kanikaAdjusted
                          ? glyph.finalX
                          : glyph.initialX;
                        return (
                          <motion.rect
                            key={`k-node-${idx}`}
                            initial={false}
                            animate={{ x: gx - 2, y: 112 }}
                            transition={{
                              duration: 0.62,
                              ease: VECTOR_DRAG_EASE,
                            }}
                            width="4"
                            height="4"
                            fill="#FAF9F6"
                            stroke="#71717A"
                            strokeWidth="0.9"
                            vectorEffect="non-scaling-stroke"
                          />
                        );
                      })}
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>

              {/* AGRAWAL — Outlined Initial Appearance -> Cinematic Live Paint Bucket Interior Fill */}
              <g>
                {AGRAWAL_GLYPHS.map((glyph, idx) => {
                  const isFilled = Boolean(filledLetters[idx]);
                  return (
                    <g key={`agrawal-group-${idx}`}>
                      {/* 1. Geometric Outlined Lettering (Transparent Interior Prior to Paint Fill) */}
                      <motion.text
                        x={glyph.x}
                        y="114"
                        textAnchor="middle"
                        fill="transparent"
                        stroke="#111111"
                        strokeLinejoin="round"
                        style={{
                          fontFamily: '"Outfit", "Inter", sans-serif',
                          fontWeight: 800,
                          fontSize: "108px",
                        }}
                        initial={
                          prefersReducedMotion
                            ? {
                                opacity: 1,
                                strokeOpacity: 0,
                                strokeWidth: 0,
                                strokeDashoffset: 0,
                              }
                            : {
                                opacity: 0,
                                strokeOpacity: 1,
                                strokeWidth: 2.15,
                                strokeDasharray: 440,
                                strokeDashoffset: 160,
                              }
                        }
                        animate={
                          !typographyPlaced
                            ? {
                                opacity: 0,
                                strokeOpacity: 1,
                                strokeWidth: 2.15,
                                strokeDashoffset: 160,
                              }
                            : isFilled
                              ? {
                                  opacity: 1,
                                  strokeOpacity: 0,
                                  strokeWidth: 0,
                                  strokeDashoffset: 0,
                                }
                              : {
                                  opacity: 1,
                                  strokeOpacity: 1,
                                  strokeWidth: 2.15,
                                  strokeDashoffset: 0,
                                }
                        }
                        transition={{
                          opacity: {
                            duration: 0.42,
                            delay:
                              typographyPlaced && !isFilled
                                ? 0.1 + idx * 0.03
                                : 0,
                            ease: EDITORIAL_EASE,
                          },
                          strokeDashoffset: {
                            duration: 0.56,
                            delay:
                              typographyPlaced && !isFilled
                                ? 0.1 + idx * 0.03
                                : 0,
                            ease: EDITORIAL_EASE,
                          },
                          strokeOpacity: {
                            duration: 0.26,
                            delay: isFilled && !prefersReducedMotion ? 0.3 : 0,
                            ease: EDITORIAL_EASE,
                          },
                          strokeWidth: {
                            duration: 0.26,
                            delay: isFilled && !prefersReducedMotion ? 0.3 : 0,
                            ease: EDITORIAL_EASE,
                          },
                        }}
                      >
                        {glyph.char}
                      </motion.text>

                      {/* 2. Organic Controlled Black Paint Spread Clipped Strictly Inside Letter Boundaries */}
                      <g clipPath={`url(#agrawal-glyph-clip-${idx})`}>
                        <motion.circle
                          cx={glyph.clickX}
                          cy={glyph.clickY}
                          fill="#111111"
                          initial={{ r: prefersReducedMotion ? 115 : 0 }}
                          animate={{ r: isFilled ? 115 : 0 }}
                          transition={{
                            duration: 0.46,
                            ease: POINTER_MOVE_EASE,
                          }}
                        />
                        <motion.ellipse
                          cx={glyph.clickX + (idx % 2 === 0 ? 5 : -5)}
                          cy={glyph.clickY - 6}
                          fill="#111111"
                          initial={{
                            rx: prefersReducedMotion ? 98 : 0,
                            ry: prefersReducedMotion ? 114 : 0,
                          }}
                          animate={{
                            rx: isFilled ? 98 : 0,
                            ry: isFilled ? 114 : 0,
                          }}
                          transition={{
                            duration: 0.4,
                            delay: 0.02,
                            ease: EDITORIAL_EASE,
                          }}
                        />
                        <motion.text
                          x={glyph.x}
                          y="114"
                          textAnchor="middle"
                          fill="#111111"
                          style={{
                            fontFamily: '"Outfit", "Inter", sans-serif',
                            fontWeight: 800,
                            fontSize: "108px",
                          }}
                          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                          animate={{ opacity: isFilled ? 1 : 0 }}
                          transition={{
                            duration: 0.22,
                            delay: isFilled && !prefersReducedMotion ? 0.32 : 0,
                            ease: EDITORIAL_EASE,
                          }}
                        >
                          {glyph.char}
                        </motion.text>
                      </g>

                      {/* Subtle Vector Click Micro-Pulse at Contact Point */}
                      <AnimatePresence>
                        {activePaintClickIdx === idx && !prefersReducedMotion && (
                          <motion.circle
                            key={`paint-pulse-${idx}`}
                            cx={glyph.clickX}
                            cy={glyph.clickY}
                            fill="none"
                            stroke="#111111"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            initial={{ r: 1.5, opacity: 0.42 }}
                            animate={{ r: 8.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                          />
                        )}
                      </AnimatePresence>
                    </g>
                  );
                })}
              </g>

              {/* Temporary Vector Selection Bounding Box & Anchor Handles (KANIKA) */}
              <AnimatePresence>
                {selectedWord === "kanika" && !prefersReducedMotion && (
                  <VectorSelectionFrame
                    key="selection-kanika"
                    x={38}
                    y={30}
                    width={kanikaBoxWidth}
                    height={88}
                    activeEastHandle={activeEastHandle}
                    transitionDuration={0.58}
                    useDragEase={kanikaAdjusted}
                  />
                )}
              </AnimatePresence>

              {/* Subtle Professional Design-Software Selection Pointer (KANIKA) */}
              {!isMobileViewport && !prefersReducedMotion && (
                <motion.g
                  initial={{ x: 168, y: 148, opacity: 0, scale: 1 }}
                  animate={{
                    x: cursor.x,
                    y: cursor.y,
                    opacity: cursor.visible ? 1 : 0,
                    scale: cursor.clicking ? 0.9 : 1,
                  }}
                  transition={{
                    x: {
                      duration: cursor.duration,
                      ease: cursor.useDragEase
                        ? VECTOR_DRAG_EASE
                        : POINTER_MOVE_EASE,
                    },
                    y: {
                      duration: cursor.duration,
                      ease: cursor.useDragEase
                        ? VECTOR_DRAG_EASE
                        : POINTER_MOVE_EASE,
                    },
                    opacity: { duration: 0.26, ease: EDITORIAL_EASE },
                    scale: { duration: 0.12, ease: EDITORIAL_EASE },
                  }}
                  filter="url(#vector-pointer-shadow)"
                  style={{ pointerEvents: "none" }}
                >
                  <path
                    d="M 0 0 L 0 18.5 L 4.8 14.3 L 8.1 21.4 L 10.7 20.2 L 7.4 13.1 L 13.4 13.1 Z"
                    fill="#141414"
                    stroke="#FFFFFF"
                    strokeWidth="1.35"
                    strokeLinejoin="round"
                  />
                </motion.g>
              )}

              {/* Realistic Vector-Design Paint Bucket / Live Paint Cursor (AGRAWAL) */}
              {!prefersReducedMotion && (
                <motion.g
                  initial={{ x: 554, y: 144, opacity: 0 }}
                  animate={{
                    x: paintBucket.x,
                    y: paintBucket.y,
                    opacity: paintBucket.visible ? 1 : 0,
                  }}
                  transition={{
                    x: {
                      duration: paintBucket.duration,
                      ease: POINTER_MOVE_EASE,
                    },
                    y: {
                      duration: paintBucket.duration,
                      ease: POINTER_MOVE_EASE,
                    },
                    opacity: { duration: 0.26, ease: EDITORIAL_EASE },
                  }}
                  filter="url(#vector-pointer-shadow)"
                  style={{ pointerEvents: "none" }}
                >
                  <motion.g
                    animate={{
                      rotate: paintBucket.pouring ? -12 : 0,
                      scale: (isMobileViewport ? 1.25 : 1) * (paintBucket.pouring ? 0.93 : 1),
                    }}
                    transition={{ duration: 0.11, ease: EDITORIAL_EASE }}
                    style={{ transformOrigin: "0px 0px" }}
                  >
                    {/* Crisp White Cursor Halo for Contrast Over White & Solid Black */}
                    <g
                      stroke="#FFFFFF"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path d="M 0 0 C 0.7 -2.3, 2.1 -4.1, 4.1 -5.2 L 5.6 -3.7 C 4.2 -2.1, 2.4 -0.8, 0 0 Z" />
                      <path d="M 4.6 -5.6 L 11.4 -12.4 L 17.8 -6.0 L 11.0 0.8 Z" />
                      <path
                        d="M 11.2 -12.2 C 13.4 -16.2, 18.8 -14.8, 17.4 -9.8"
                        fill="none"
                      />
                    </g>

                    {/* Controlled Pour Tip at Exact Hotspot (0, 0) */}
                    <path
                      d="M 0 0 C 0.7 -2.3, 2.1 -4.1, 4.1 -5.2 L 5.6 -3.7 C 4.2 -2.1, 2.4 -0.8, 0 0 Z"
                      fill="#111111"
                    />

                    {/* Wire Bail Handle */}
                    <path
                      d="M 11.2 -12.2 C 13.4 -16.2, 18.8 -14.8, 17.4 -9.8"
                      fill="none"
                      stroke="#141414"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />

                    {/* Tilted Vector Bucket Body */}
                    <path
                      d="M 4.6 -5.6 L 11.4 -12.4 L 17.8 -6.0 L 11.0 0.8 Z"
                      fill="#141414"
                      stroke="#FFFFFF"
                      strokeWidth="0.7"
                      strokeLinejoin="round"
                    />

                    {/* Open Bucket Mouth Rim Detail */}
                    <line
                      x1="4.9"
                      y1="-5.3"
                      x2="10.7"
                      y2="0.5"
                      stroke="#FAF9F6"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />

                    {/* Subtle Live-Paint Active Swatch Micro-Preview */}
                    <g transform="translate(5.5, -20.5)">
                      <rect
                        x="0"
                        y="0.5"
                        width="3.2"
                        height="3.2"
                        fill="#E4E4E7"
                        stroke="#FFFFFF"
                        strokeWidth="0.7"
                      />
                      <rect
                        x="3.6"
                        y="0"
                        width="4.2"
                        height="4.2"
                        fill="#111111"
                        stroke="#FFFFFF"
                        strokeWidth="0.85"
                      />
                      <rect
                        x="8.2"
                        y="0.5"
                        width="3.2"
                        height="3.2"
                        fill="#A1A1AA"
                        stroke="#FFFFFF"
                        strokeWidth="0.7"
                      />
                    </g>
                  </motion.g>
                </motion.g>
              )}
            </svg>
          </motion.div>

          {/* 2. Portrait & Left-Side Explore Portfolio CTA Stage */}
          <div className="mt-3 sm:mt-4 lg:mt-[clamp(0.75rem,2.2dvh,1.75rem)] relative w-full flex flex-col items-center shrink-0">
            {/* Large Centred Black-and-White Portrait Photograph (Proportionally Viewport-Bounded) */}
            <motion.div
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      clipPath: "inset(10% 6% 10% 6% round 24px)",
                      opacity: 0,
                      scale: 0.975,
                    }
              }
              animate={
                portraitVisible || prefersReducedMotion
                  ? {
                      clipPath: "inset(0% 0% 0% 0% round 24px)",
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      clipPath: "inset(10% 6% 10% 6% round 24px)",
                      opacity: 0,
                      scale: 0.975,
                    }
              }
              transition={{
                duration: 0.88,
                ease: EDITORIAL_EASE,
              }}
              style={{ willChange: "clip-path, transform, opacity" }}
              className="relative w-[min(74vw,280px,calc((100dvh-205px)*0.75))] sm:w-[min(330px,calc((100dvh-265px)*0.75))] md:w-[min(360px,calc((100dvh-270px)*0.75))] lg:w-[min(396px,calc((100dvh-245px)*0.75))] xl:w-[min(408px,calc((100dvh-245px)*0.75))] aspect-[3/4] rounded-[22px] sm:rounded-[24px] overflow-hidden bg-[#EAE9E4] border border-black/[0.08] shadow-[0_22px_54px_-18px_rgba(0,0,0,0.16)] shrink-0"
            >
            <picture className="w-full h-full block">
              <source
                srcSet={`${PROFILE_PIC_CARD_WEBP} 640w, ${PROFILE_PIC_FULL_WEBP} 1280w`}
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 410px"
                type="image/webp"
              />
              <img
                src={PROFILE_PIC_FALLBACK}
                alt="Kanika Agrawal"
                width={960}
                height={1280}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover object-center grayscale contrast-[1.05] brightness-[1.01] select-none"
              />
            </picture>
            <div
              className="absolute inset-0 ring-1 ring-inset ring-black/[0.06] rounded-[22px] sm:rounded-[24px] pointer-events-none"
              aria-hidden="true"
            />
            </motion.div>

            {/* 3. Explore Portfolio -> Pill CTA (Left-Positioned on Desktop, Stacked Safely Below on Smaller Screens) */}
            <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-0 h-[50px] sm:h-[56px] flex items-center justify-center shrink-0 lg:absolute lg:-left-5 xl:left-8 2xl:left-12 lg:top-[62%] lg:-translate-y-1/2 z-20">
            <AnimatePresence>
              {buttonVisible && (
                <motion.button
                  key="explore-portfolio-cta"
                  type="button"
                  onClick={triggerSeamlessExit}
                  aria-label="Explore Portfolio"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 12, scale: 0.97 }
                  }
                  animate={
                    buttonEmphasis && !prefersReducedMotion
                      ? {
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.022, 1],
                        }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  whileHover={
                    prefersReducedMotion ? undefined : { scale: 1.022, y: -1.5 }
                  }
                  whileTap={
                    prefersReducedMotion ? undefined : { scale: 0.975, y: 0 }
                  }
                  transition={{
                    opacity: { duration: 0.42, ease: EDITORIAL_EASE },
                    y: { duration: 0.48, ease: EDITORIAL_EASE },
                    scale: buttonEmphasis
                      ? { duration: 0.44, ease: POINTER_MOVE_EASE }
                      : { duration: 0.22, ease: EDITORIAL_EASE },
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-[#111111] hover:bg-[#1E1E1C] active:bg-zinc-800 text-[#FAF9F6] border border-black/15 hover:border-white/20 text-[14px] sm:text-[15px] font-medium tracking-[-0.005em] whitespace-nowrap shrink-0 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.22)] hover:shadow-[0_18px_38px_-8px_rgba(0,0,0,0.3)] transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAF9F6]"
                >
                  {/* Subtle Final Settle Sheen */}
                  {buttonEmphasis && !prefersReducedMotion && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: "-120%", opacity: 0 }}
                      animate={{ x: "140%", opacity: [0, 0.2, 0] }}
                      transition={{ duration: 0.72, ease: POINTER_MOVE_EASE }}
                      className="pointer-events-none absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"
                    />
                  )}

                  {/* Progressive Character-by-Character Typing Track */}
                  <span className="relative inline-flex items-center">
                    <span
                      aria-hidden="true"
                      className="invisible select-none whitespace-pre"
                    >
                      {CTA_LABEL}
                    </span>

                    <span className="absolute inset-y-0 left-0 inline-flex items-center whitespace-pre">
                      {CTA_CHARACTERS.slice(0, typedCount).map((ch, idx) => (
                        <motion.span
                          key={`cta-ch-${idx}`}
                          initial={
                            prefersReducedMotion
                              ? { opacity: 1, y: 0 }
                              : { opacity: 0, y: 2.5 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.16,
                            ease: EDITORIAL_EASE,
                          }}
                          className="inline-block"
                        >
                          {ch === " " ? "\u00A0" : ch}
                        </motion.span>
                      ))}

                      <AnimatePresence>
                        {typingLineVisible && !prefersReducedMotion && (
                          <motion.span
                            key="cta-typing-line"
                            aria-hidden="true"
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 0.9 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{
                              duration: 0.18,
                              ease: EDITORIAL_EASE,
                            }}
                            className="inline-block w-[1.5px] h-[1.05em] ml-[2px] bg-[#FAF9F6] rounded-full origin-center"
                          />
                        )}
                      </AnimatePresence>
                    </span>
                  </span>

                  {/* Right-Facing Arrow (->) Slide-In + Hover Shift */}
                  <span className="relative inline-flex items-center justify-center w-4">
                    {arrowVisible && (
                      <motion.span
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1, x: 0 }
                            : { opacity: 0, x: -9 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.36, ease: EDITORIAL_EASE }}
                        className="inline-flex items-center justify-center"
                      >
                        <span className="inline-block leading-none transition-transform duration-200 ease-out group-hover:translate-x-1.5 group-active:translate-x-1.5">
                          →
                        </span>
                      </motion.span>
                    )}
                  </span>
                </motion.button>
              )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
