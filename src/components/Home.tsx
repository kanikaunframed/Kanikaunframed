import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { OfficeHeroShowcase } from "./OfficeHeroShowcase";

interface HomeProps {
  key?: React.Key;
  setActiveSection: (section: string) => void;
  isIntroActive?: boolean;
}

export function Home({ setActiveSection, isIntroActive = false }: HomeProps) {
  const prefersReducedMotion = useReducedMotion();

  const editorialEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const readyToReveal = !isIntroActive;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
      className="absolute inset-0 w-full h-full bg-white overflow-y-auto lg:overflow-hidden overflow-x-hidden scroll-smooth"
    >
      <div className="relative z-10 min-h-full lg:h-full w-full max-w-[1440px] mx-auto px-5 sm:px-8 md:px-12 lg:px-14 py-5 sm:py-6 lg:py-4 flex items-center">
        {/* Balanced Two-Column Creative Studio Hero Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-7 sm:gap-8 lg:gap-8 xl:gap-10 items-center">
          {/* Left Column: Headline, Subtitle & Preserved CTAs */}
          <div className="flex flex-col items-start text-left min-w-0">
            <h1 className="font-display font-extrabold tracking-[-0.038em] leading-[1.01] text-[clamp(2.55rem,5.4vw,5.45rem)] text-[#111111] max-w-full">
              {/* Line 1: Thinking */}
              <span className="block overflow-hidden pb-1.5">
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  animate={
                    readyToReveal || prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  transition={{
                    duration: 0.72,
                    delay: 0.08,
                    ease: editorialEase,
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="block"
                >
                  Thinking
                </motion.span>
              </span>

              {/* Line 2: BEYOND (Outlined Geometric Typography) + The (Editorial Italic) */}
              <span className="block overflow-hidden pt-1 pb-1.5 pr-3 -mt-1">
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  animate={
                    readyToReveal || prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  transition={{
                    duration: 0.72,
                    delay: 0.17,
                    ease: editorialEase,
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="inline-flex flex-nowrap whitespace-nowrap items-baseline gap-x-[0.28em]"
                >
                  <span
                    style={{
                      color: "transparent",
                      WebkitTextStroke: "clamp(1.35px, 0.14vw, 2px) #18181B",
                    }}
                    className="inline-block uppercase tracking-[-0.03em] transition-colors duration-500 hover:!text-[#111111]"
                  >
                    Beyond
                  </span>
                  <span className="inline-block font-sans font-light italic text-zinc-400 tracking-[-0.02em] pr-[0.18em]">
                    The
                  </span>
                </motion.span>
              </span>

              {/* Line 3: Pixels + Vector Node Accent */}
              <span className="block overflow-hidden pb-1.5">
                <motion.span
                  initial={
                    prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  animate={
                    readyToReveal || prefersReducedMotion
                      ? { y: "0%", opacity: 1 }
                      : { y: "108%", opacity: 0 }
                  }
                  transition={{
                    duration: 0.72,
                    delay: 0.26,
                    ease: editorialEase,
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="inline-flex items-baseline gap-2.5"
                >
                  <span>Pixels</span>
                  <span
                    aria-hidden="true"
                    className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 border-[1.5px] border-[#111111] bg-[#FAF9F6] -translate-y-0.5"
                  />
                </motion.span>
              </span>
            </h1>

            {/* Subtitle Directly Beneath Main Headline */}
            <motion.div
              initial={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }
              }
              animate={
                readyToReveal || prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 14 }
              }
              transition={{ duration: 0.62, delay: 0.34, ease: editorialEase }}
              style={{ willChange: "transform, opacity" }}
              className="mt-5 sm:mt-6"
            >
              <p className="text-lg sm:text-xl md:text-2xl font-medium tracking-[-0.015em] text-zinc-900 leading-snug">
                Visual Communication Designer
              </p>
            </motion.div>

            {/* Preserved Primary & Secondary CTA Buttons */}
            <motion.div
              initial={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }
              }
              animate={
                readyToReveal || prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 16 }
              }
              transition={{ duration: 0.62, delay: 0.42, ease: editorialEase }}
              style={{ willChange: "transform, opacity" }}
              className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setActiveSection("work")}
                className="group relative min-h-[48px] inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-[#111111] text-white text-xs sm:text-[13px] font-semibold tracking-[0.14em] uppercase shadow-[0_12px_30px_-8px_rgba(0,0,0,0.22)] hover:bg-zinc-800 hover:-translate-y-0.5 hover:scale-[1.015] hover:shadow-[0_18px_36px_-8px_rgba(0,0,0,0.28)] active:translate-y-0 active:scale-[0.985] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <span>EXPLORE MY WORK</span>
                <ArrowUpRight
                  size={16}
                  className="stroke-[2.1] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("contact")}
                className="group relative min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white/70 backdrop-blur-xl border border-black/12 text-zinc-900 text-xs sm:text-[13px] font-semibold tracking-[0.14em] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:bg-white hover:border-black/25 hover:-translate-y-0.5 hover:scale-[1.015] active:translate-y-0 active:scale-[0.985] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <span>LET&apos;S COLLABORATE</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Horizontally Centred Kanika Unframed Office Showcase (~48-50% visual width) */}
          <div className="w-full flex items-center justify-center">
            <OfficeHeroShowcase isIntroActive={isIntroActive} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
