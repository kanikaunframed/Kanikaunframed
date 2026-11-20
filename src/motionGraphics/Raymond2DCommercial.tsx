import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export interface Commercial2DProps {
  reducedMotion: boolean;
  onComplete: () => void;
}

/**
 * PROJECT 01 — RAYMOND
 * Refined for Compact Centred 16:9 Media Window
 * - Deep-red animated 2D studio background with refined moving spotlight & layered shadows.
 * - Entire Raymond shopping bag remains 100% visible throughout entrance & settle (zero edge cropping).
 * - Subtle, natural independent 2D satin ribbon handle lift & settle.
 * - Preserves 100% of authentic Raymond bag artwork ("R" man/woman silhouette + "THE COMPLETE YOU")
 *   completely unclipped with zero duplicate or overlapping tagline text.
 */
export function Raymond2DCommercial({
  reducedMotion,
  onComplete,
}: Commercial2DProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageGroupRef = useRef<SVGGElement | null>(null);
  const spotlightGroupRef = useRef<SVGGElement | null>(null);
  const bagWrapperRef = useRef<SVGGElement | null>(null);
  const leftGussetRef = useRef<SVGPathElement | null>(null);
  const rightGussetRef = useRef<SVGPathElement | null>(null);
  const bagAmbientShadowRef = useRef<SVGEllipseElement | null>(null);
  const bagContactShadowRef = useRef<SVGEllipseElement | null>(null);
  const frontRibbonRef = useRef<SVGPathElement | null>(null);
  const frontRibbonHighlightRef = useRef<SVGPathElement | null>(null);
  const ribbonShadowRef = useRef<SVGPathElement | null>(null);
  const rearRibbonRef = useRef<SVGPathElement | null>(null);
  const lightSweepRef = useRef<SVGRectElement | null>(null);
  const paperTextureRef = useRef<SVGRectElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    // Bag dimensions inside 1600x900 (16:9):
    // Centred at x = 800, y = 248..668 (width = 488, height = 420)
    // Leaves generous negative space: top = 248px (handles stay >= 158px), bottom = 232px, sides = 556px.
    const handleState = {
      lift: 0, // 0 = natural downward drape, 1 = subtle poised upward arch
      swayX: 0,
    };

    const syncRibbonPaths = () => {
      const l = handleState.lift;
      const sx = handleState.swayX;

      const leftAnchorX = 696;
      const rightAnchorX = 904;
      const anchorY = 282;

      // Subtle, natural upward lift without exaggeration (stays comfortably inside y >= 158)
      const cpY = gsap.utils.interpolate(398, 168, l);
      const shoulderOffset = gsap.utils.interpolate(22, -8, l);

      const frontD = `M ${leftAnchorX} ${anchorY} C ${
        leftAnchorX + shoulderOffset + sx * 0.55
      } ${cpY}, ${
        rightAnchorX - shoulderOffset + sx * 0.55
      } ${cpY}, ${rightAnchorX} ${anchorY}`;

      const shadowY = gsap.utils.interpolate(414, 266, l);
      const shadowD = `M ${leftAnchorX - 3} ${anchorY + 7} C ${
        leftAnchorX + shoulderOffset + sx * 0.6 - 6
      } ${shadowY}, ${
        rightAnchorX - shoulderOffset + sx * 0.6 - 6
      } ${shadowY}, ${rightAnchorX - 3} ${anchorY + 7}`;

      const rearCpY = gsap.utils.interpolate(368, 180, l * 0.9);
      const rearD = `M ${leftAnchorX + 10} ${anchorY - 14} C ${
        leftAnchorX + 26 + sx * 0.45
      } ${rearCpY}, ${rightAnchorX - 26 + sx * 0.45} ${rearCpY}, ${
        rightAnchorX - 10
      } ${anchorY - 14}`;

      frontRibbonRef.current?.setAttribute("d", frontD);
      frontRibbonHighlightRef.current?.setAttribute("d", frontD);
      ribbonShadowRef.current?.setAttribute("d", shadowD);
      rearRibbonRef.current?.setAttribute("d", rearD);
    };

    syncRibbonPaths();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: syncRibbonPaths,
        onComplete: finish,
      });

      if (reducedMotion) {
        gsap.set(spotlightGroupRef.current, { opacity: 0.95, x: 0 });
        gsap.set(bagWrapperRef.current, { x: 0, y: 0, scale: 1, opacity: 1 });
        gsap.set(bagAmbientShadowRef.current, { attr: { cx: 800, rx: 280 }, opacity: 0.65 });
        gsap.set(bagContactShadowRef.current, { attr: { cx: 800, rx: 220 }, opacity: 0.85 });
        tl.to(
          stageGroupRef.current,
          {
            scale: 1.03,
            svgOrigin: "800 458",
            duration: 2.4,
            ease: "power2.out",
          },
          0
        ).to({}, { duration: 0.8 }, 2.2);
        return;
      }

      // Initial state: entire bag begins inside the left-centre safe area (x = 556 - 165 = 391..895)
      // so zero pixels of the bag are ever cropped at the window boundary.
      gsap.set(spotlightGroupRef.current, {
        opacity: 0.25,
        x: -70,
        scale: 0.94,
        svgOrigin: "800 180",
      });
      gsap.set(bagWrapperRef.current, {
        x: -165,
        y: 8,
        scale: 0.95,
        rotation: -1.4,
        opacity: 0,
        svgOrigin: "800 668",
      });
      gsap.set(bagAmbientShadowRef.current, {
        attr: { cx: 635, rx: 245 },
        opacity: 0,
      });
      gsap.set(bagContactShadowRef.current, {
        attr: { cx: 635, rx: 195 },
        opacity: 0,
      });
      gsap.set(leftGussetRef.current, { x: -7 });
      gsap.set(rightGussetRef.current, { x: -5 });
      gsap.set(lightSweepRef.current, { attr: { x: 300 }, opacity: 0 });
      gsap.set(paperTextureRef.current, { opacity: 0.16 });
      gsap.set(stageGroupRef.current, { scale: 1, y: 0, svgOrigin: "800 458" });

      // SCENE 1 (0.0s - 1.0s): Deep-red studio & warm overhead spotlight awakens
      tl.to(
        spotlightGroupRef.current,
        {
          opacity: 0.95,
          x: 0,
          scale: 1,
          duration: 1.35,
          ease: "power2.out",
        },
        0
      );

      // SCENE 2 (0.35s - 2.1s): Entire Raymond bag fades & glides smoothly into exact centre without clipping
      tl.to(
        bagWrapperRef.current,
        {
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
        },
        0.32
      )
        .to(
          bagWrapperRef.current,
          {
            x: 0,
            y: 0,
            scale: 1,
            duration: 1.65,
            ease: "power3.out",
          },
          0.32
        )
        .to(
          bagWrapperRef.current,
          {
            rotation: 0.35,
            duration: 1.0,
            ease: "power2.out",
          },
          0.32
        )
        .to(
          bagWrapperRef.current,
          {
            rotation: 0,
            duration: 0.65,
            ease: "sine.inOut",
          },
          1.32
        )
        .to(
          bagAmbientShadowRef.current,
          {
            attr: { cx: 800, rx: 290 },
            opacity: 0.68,
            duration: 1.65,
            ease: "power3.out",
          },
          0.32
        )
        .to(
          bagContactShadowRef.current,
          {
            attr: { cx: 800, rx: 228 },
            opacity: 0.88,
            duration: 1.65,
            ease: "power3.out",
          },
          0.32
        )
        .to(
          [leftGussetRef.current, rightGussetRef.current],
          {
            x: 0,
            duration: 1.45,
            ease: "power2.out",
          },
          0.45
        )
        // Gentle satin ribbon follow-through during bag glide
        .to(
          handleState,
          { swayX: 11, duration: 0.58, ease: "sine.out" },
          0.42
        )
        .to(
          handleState,
          { swayX: -4, duration: 0.52, ease: "sine.inOut" },
          1.0
        )
        .to(
          handleState,
          { swayX: 0, duration: 0.45, ease: "sine.out" },
          1.52
        );

      // SCENE 3 (2.05s - 3.55s): Subtle, natural independent upward handle lift & settle
      tl.to(
        handleState,
        {
          lift: 0.62,
          duration: 0.72,
          ease: "power2.inOut",
        },
        2.05
      )
        .to(
          ribbonShadowRef.current,
          {
            opacity: 0.18,
            duration: 0.72,
            ease: "power2.inOut",
          },
          2.05
        )
        .to(
          handleState,
          {
            lift: 0.12,
            duration: 0.82,
            ease: "power2.out",
          },
          2.77
        )
        .to(
          ribbonShadowRef.current,
          {
            opacity: 0.44,
            duration: 0.82,
            ease: "power2.out",
          },
          2.77
        );

      // SCENE 4 & 5 (3.25s - 5.95s): Refined moving spotlight & 2D light sweep across matte red grain,
      // illuminating the original "R" logo and complete "THE COMPLETE YOU" artwork cleanly in centre
      tl.to(
        stageGroupRef.current,
        {
          scale: 1.045,
          svgOrigin: "800 458",
          duration: 1.85,
          ease: "power2.inOut",
        },
        3.25
      )
        .to(
          spotlightGroupRef.current,
          {
            x: 24,
            duration: 1.4,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          },
          3.25
        )
        .to(
          lightSweepRef.current,
          {
            opacity: 0.9,
            duration: 0.35,
            ease: "sine.in",
          },
          3.35
        )
        .to(
          lightSweepRef.current,
          {
            attr: { x: 1120 },
            duration: 1.55,
            ease: "power2.inOut",
          },
          3.35
        )
        .to(
          paperTextureRef.current,
          {
            opacity: 0.32,
            duration: 0.75,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          },
          3.4
        )
        .to(
          lightSweepRef.current,
          {
            opacity: 0,
            duration: 0.4,
            ease: "sine.out",
          },
          4.55
        )
        .to({}, { duration: 1.05 }, 4.9);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#1A0205] select-none"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          {/* Rich Deep-Red Luxury Studio Interior */}
          <radialGradient id="ray-bg-grad" cx="50%" cy="46%" r="66%">
            <stop offset="0%" stopColor="#540A14" />
            <stop offset="52%" stopColor="#2E040A" />
            <stop offset="100%" stopColor="#140104" />
          </radialGradient>

          {/* Refined Overhead 2D Spotlight Cone */}
          <radialGradient id="ray-spot-beam" cx="50%" cy="38%" r="50%">
            <stop offset="0%" stopColor="#FFD8DC" stopOpacity="0.26" />
            <stop offset="48%" stopColor="#B81424" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#1A0205" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Studio Plinth Horizon */}
          <linearGradient id="ray-floor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38050C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#130103" stopOpacity="0.95" />
          </linearGradient>

          {/* Exact Sampled Raymond Bag Crimson (#991013) for Seamless Unclipped Artwork Integration */}
          <linearGradient id="ray-bag-crimson" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#A11216" />
            <stop offset="48%" stopColor="#991013" />
            <stop offset="100%" stopColor="#850C10" />
          </linearGradient>

          {/* 2D Side-Gusset Layered Shading */}
          <linearGradient id="ray-gusset-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#52050B" />
            <stop offset="100%" stopColor="#7A0A10" />
          </linearGradient>
          <linearGradient id="ray-gusset-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C0B12" />
            <stop offset="100%" stopColor="#54060C" />
          </linearGradient>

          {/* Woven Crimson Satin Handle Gradient */}
          <linearGradient id="ray-satin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BC1826" />
            <stop offset="46%" stopColor="#8E0B15" />
            <stop offset="76%" stopColor="#CC2232" />
            <stop offset="100%" stopColor="#6D0710" />
          </linearGradient>

          {/* Soft Moving 2D Light Sweep */}
          <linearGradient id="ray-sheen-sweep" x1="0%" y1="0%" x2="100%" y2="12%">
            <stop offset="0%" stopColor="#FFF5F2" stopOpacity="0" />
            <stop offset="38%" stopColor="#FFE6E0" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#FFF8F5" stopOpacity="0.3" />
            <stop offset="62%" stopColor="#FFE6E0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFF5F2" stopOpacity="0" />
          </linearGradient>

          {/* Subtle Laid-Paper Surface Grain */}
          <pattern
            id="ray-paper-weave"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 3.5 H 14 M 0 10.5 H 14 M 3.5 0 V 14 M 10.5 0 V 14"
              stroke="#FFF0EC"
              strokeWidth="0.4"
              strokeOpacity="0.08"
            />
          </pattern>

          {/* Rectangular 4-Edge Soft Blend Mask (Preserves 100% of "THE COMPLETE YOU" & "R" Unclipped) */}
          <linearGradient id="ray-edge-h" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="3.5%" stopColor="#FFFFFF" />
            <stop offset="96.5%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <linearGradient id="ray-edge-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="3.5%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="96.5%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <mask id="ray-horiz-mask">
            <rect x="576" y="256" width="448" height="398" fill="url(#ray-edge-h)" />
          </mask>
          <mask id="ray-rect-artwork-mask">
            <rect
              x="576"
              y="256"
              width="448"
              height="398"
              fill="url(#ray-edge-v)"
              mask="url(#ray-horiz-mask)"
            />
          </mask>

          <clipPath id="ray-bag-clip">
            <rect x="556" y="248" width="488" height="420" rx="5" />
          </clipPath>

          <filter id="ray-ambient-blur" x="-35%" y="-50%" width="170%" height="200%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <filter id="ray-contact-blur" x="-25%" y="-40%" width="150%" height="180%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="ray-ribbon-shadow-blur" x="-20%" y="-20%" width="140%" height="150%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        {/* Studio Interior */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#ray-bg-grad)" />
        <rect x="0" y="642" width="1600" height="258" fill="url(#ray-floor-grad)" />
        <line
          x1="0"
          y1="642"
          x2="1600"
          y2="642"
          stroke="#FFE2DC"
          strokeOpacity="0.06"
          strokeWidth="1"
        />

        <g ref={stageGroupRef}>
          {/* Moving Soft Studio Spotlight */}
          <g ref={spotlightGroupRef}>
            <polygon
              points="610,0 990,0 1290,760 310,760"
              fill="url(#ray-spot-beam)"
            />
            <ellipse
              cx="800"
              cy="668"
              rx="380"
              ry="48"
              fill="#A61222"
              fillOpacity="0.22"
              filter="url(#ray-ambient-blur)"
            />
          </g>

          {/* Layered 2D Floor Shadows (Soft Ambient + Grounded Contact Core) */}
          <ellipse
            ref={bagAmbientShadowRef}
            cx="800"
            cy="676"
            rx="290"
            ry="28"
            fill="#0A0001"
            opacity="0.68"
            filter="url(#ray-ambient-blur)"
          />
          <ellipse
            ref={bagContactShadowRef}
            cx="800"
            cy="670"
            rx="228"
            ry="11"
            fill="#060001"
            opacity="0.88"
            filter="url(#ray-contact-blur)"
          />

          {/* 2D Illustrated Raymond Luxury Shopping Bag */}
          <g ref={bagWrapperRef}>
            {/* Rear Top Rim Cuff */}
            <rect
              x="566"
              y="240"
              width="468"
              height="14"
              rx="3"
              fill="#4D050B"
            />

            {/* Rear Satin Ribbon Handle */}
            <path
              ref={rearRibbonRef}
              d="M 706 268 C 722 368, 878 368, 894 268"
              fill="none"
              stroke="#5E060E"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Left & Right 2D V-Pleated Side Gussets */}
            <path
              ref={leftGussetRef}
              d="M 540 256 L 558 248 L 558 668 L 540 656 Z"
              fill="url(#ray-gusset-left)"
            />
            <path
              ref={rightGussetRef}
              d="M 1042 248 L 1060 256 L 1060 656 L 1042 668 Z"
              fill="url(#ray-gusset-right)"
            />

            {/* Matte Crimson Front Bag Face */}
            <rect
              x="556"
              y="248"
              width="488"
              height="420"
              rx="5"
              fill="url(#ray-bag-crimson)"
            />

            {/* Clipped Bag Face Details & Complete Authentic Raymond Artwork ("R" + "THE COMPLETE YOU") */}
            <g clipPath="url(#ray-bag-clip)">
              <image
                href="/extracted/raymond-panel.webp"
                x="576"
                y="256"
                width="448"
                height="398"
                preserveAspectRatio="xMidYMid meet"
                mask="url(#ray-rect-artwork-mask)"
              />

              {/* Subtle 2D Laid-Paper Packaging Texture */}
              <rect
                ref={paperTextureRef}
                x="556"
                y="248"
                width="488"
                height="420"
                fill="url(#ray-paper-weave)"
                opacity="0.18"
              />

              {/* Top Rim Highlight & Turnover Cuff Crease */}
              <line
                x1="556"
                y1="249.5"
                x2="1044"
                y2="249.5"
                stroke="#FFD0D5"
                strokeOpacity="0.28"
                strokeWidth="1.4"
              />
              <line
                x1="556"
                y1="302"
                x2="1044"
                y2="302"
                stroke="#3E0308"
                strokeOpacity="0.18"
                strokeWidth="1"
              />
              <line
                x1="556"
                y1="659"
                x2="1044"
                y2="659"
                stroke="#3A0307"
                strokeOpacity="0.32"
                strokeWidth="1.8"
              />

              {/* Soft Moving 2D Light Sweep */}
              <rect
                ref={lightSweepRef}
                x="300"
                y="220"
                width="280"
                height="470"
                transform="skewX(-18)"
                fill="url(#ray-sheen-sweep)"
                opacity="0"
              />
            </g>

            {/* Crimson-Lacquered Grommet Eyelets */}
            {[696, 904].map((gx) => (
              <g key={gx}>
                <circle
                  cx={gx}
                  cy={282}
                  r={10.5}
                  fill="#3A0308"
                  stroke="#BA2835"
                  strokeOpacity="0.55"
                  strokeWidth="2.2"
                />
                <circle cx={gx} cy={282} r={5.8} fill="#1E0104" />
              </g>
            ))}

            {/* Soft Cast Shadow of Front Satin Handle onto Bag */}
            <path
              ref={ribbonShadowRef}
              d="M 693 289 C 712 414, 876 414, 901 289"
              fill="none"
              stroke="#240104"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.44"
              filter="url(#ray-ribbon-shadow-blur)"
            />

            {/* Independently Animated Front Woven Satin Ribbon Handle */}
            <path
              ref={frontRibbonRef}
              d="M 696 282 C 718 398, 882 398, 904 282"
              fill="none"
              stroke="url(#ray-satin-grad)"
              strokeWidth="19.5"
              strokeLinecap="round"
            />
            <path
              ref={frontRibbonHighlightRef}
              d="M 696 282 C 718 398, 882 398, 904 282"
              fill="none"
              stroke="#FFA2AB"
              strokeOpacity="0.34"
              strokeWidth="2.6"
              strokeDasharray="2 3"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
