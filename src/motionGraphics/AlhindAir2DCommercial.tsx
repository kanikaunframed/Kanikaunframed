import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Commercial2DProps } from "./Raymond2DCommercial";

/**
 * PROJECT 02 — ALHIND AIR
 * Cinematic Illustrated 2D Airline Commercial (Refined for Compact 16:9 Window)
 * - Initial aircraft position 100% clear & unclipped on the right end of the runway from frame 1.
 * - Progressive runway acceleration with scrolling runway markings & visibly rotating spoked wheels.
 * - Smooth nose-up pitch, controlled diagonal liftoff & articulated 2D landing-gear retraction.
 * - Multi-speed 2D cloud parallax + warm golden sunlight sweep across authentic Alhind Air livery.
 * - Balanced final sky composition with authentic Alhind Air logo & "Where every journey feels closer."
 */
export function AlhindAir2DCommercial({
  reducedMotion,
  onComplete,
}: Commercial2DProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skyCameraRef = useRef<SVGGElement | null>(null);
  const airportWorldRef = useRef<SVGGElement | null>(null);
  const runwayMarkingsRef = useRef<SVGGElement | null>(null);
  const backCloudsRef = useRef<SVGGElement | null>(null);
  const midCloudsRef = useRef<SVGGElement | null>(null);
  const foreCloudsRef = useRef<SVGGElement | null>(null);

  const aircraftGroupRef = useRef<SVGGElement | null>(null);
  const runwayShadowRef = useRef<SVGEllipseElement | null>(null);
  const noseGearRef = useRef<SVGGElement | null>(null);
  const mainGearRef = useRef<SVGGElement | null>(null);
  const noseWheelRef = useRef<SVGGElement | null>(null);
  const mainWheelFrontRef = useRef<SVGGElement | null>(null);
  const mainWheelRearRef = useRef<SVGGElement | null>(null);
  const gearDoorsRef = useRef<SVGGElement | null>(null);
  const sunlightSweepRef = useRef<SVGRectElement | null>(null);
  const engineShimmerRef = useRef<SVGEllipseElement | null>(null);
  const brandingGroupRef = useRef<SVGGElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    const motionState = {
      wheelSpin: 0,
      runwayScroll: 0,
    };

    const syncWheelsAndRunway = () => {
      const deg = -motionState.wheelSpin;
      if (noseWheelRef.current) {
        noseWheelRef.current.setAttribute(
          "transform",
          `translate(-192, -13) rotate(${deg.toFixed(1)})`
        );
      }
      if (mainWheelFrontRef.current) {
        mainWheelFrontRef.current.setAttribute(
          "transform",
          `translate(26, -16) rotate(${deg.toFixed(1)})`
        );
      }
      if (mainWheelRearRef.current) {
        mainWheelRearRef.current.setAttribute(
          "transform",
          `translate(56, -16) rotate(${deg.toFixed(1)})`
        );
      }
      if (runwayMarkingsRef.current) {
        const offset = motionState.runwayScroll % 180;
        runwayMarkingsRef.current.setAttribute(
          "transform",
          `translate(${offset.toFixed(2)}, 0)`
        );
      }
    };

    syncWheelsAndRunway();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: syncWheelsAndRunway,
        onComplete: finish,
      });

      if (reducedMotion) {
        gsap.set(airportWorldRef.current, { y: 320, opacity: 0 });
        gsap.set(aircraftGroupRef.current, {
          x: 800,
          y: 365,
          rotation: 3.5,
          scale: 0.78,
          svgOrigin: "40 0",
        });
        gsap.set([noseGearRef.current, mainGearRef.current, gearDoorsRef.current], {
          opacity: 0,
        });
        gsap.set(runwayShadowRef.current, { opacity: 0 });
        gsap.set(midCloudsRef.current, { x: 180, y: 55, opacity: 0.92 });
        gsap.set(foreCloudsRef.current, { x: 240, y: 95, opacity: 0.72 });
        tl.fromTo(
          brandingGroupRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.85, ease: "power2.out" },
          0.9
        ).to({}, { duration: 1.2 }, 1.8);
        return;
      }

      // Initial Scene 1 state:
      // Entire aircraft (nose x = 975, tail x = 1408) sits clearly inside the right runway safe area!
      gsap.set(airportWorldRef.current, { x: 0, y: 0, opacity: 1 });
      gsap.set(aircraftGroupRef.current, {
        x: 1190,
        y: 716, // Aligned cleanly on tarmac centreline
        rotation: 0,
        scale: 0.76,
        svgOrigin: "40 0", // Pivot around main landing gear
      });
      gsap.set(runwayShadowRef.current, {
        attr: { cx: 1190, rx: 196, ry: 10 },
        opacity: 0.48,
      });
      gsap.set(noseGearRef.current, {
        rotation: 0,
        opacity: 1,
        svgOrigin: "-192 -52",
      });
      gsap.set(mainGearRef.current, {
        rotation: 0,
        opacity: 1,
        svgOrigin: "41 -56",
      });
      gsap.set(gearDoorsRef.current, {
        scaleY: 1,
        opacity: 1,
        svgOrigin: "0 -52",
      });
      gsap.set(sunlightSweepRef.current, { attr: { x: -420 }, opacity: 0 });
      gsap.set(engineShimmerRef.current, { opacity: 0.16, scaleX: 0.85 });
      gsap.set(backCloudsRef.current, { x: -40, y: -20, opacity: 0.82 });
      gsap.set(midCloudsRef.current, { x: -220, y: -95, opacity: 0.76 });
      gsap.set(foreCloudsRef.current, { x: -420, y: -150, opacity: 0 });
      gsap.set(brandingGroupRef.current, { opacity: 0, y: 16 });

      // Slow distant cloud drift across entire film
      tl.to(
        backCloudsRef.current,
        { x: 240, duration: 7.1, ease: "none" },
        0
      );

      // SCENE 1 & 2 (0.0s - 2.95s): Clear runway roll with progressive acceleration,
      // scrolling tarmac markings & visibly accelerating wheel rotation
      tl.to(
        aircraftGroupRef.current,
        {
          x: 685,
          scale: 0.8,
          duration: 2.95,
          ease: "power2.inOut",
        },
        0.15
      )
        .to(
          runwayShadowRef.current,
          {
            attr: { cx: 685, rx: 205 },
            duration: 2.95,
            ease: "power2.inOut",
          },
          0.15
        )
        .to(
          motionState,
          {
            wheelSpin: 2680,
            runwayScroll: 1560,
            duration: 3.15,
            ease: "power2.in",
          },
          0.15
        )
        .to(
          engineShimmerRef.current,
          {
            opacity: 0.58,
            scaleX: 1.4,
            duration: 1.4,
            ease: "power2.in",
          },
          1.45
        );

      // SCENE 3 (2.65s - 4.75s): Smooth nose elevation, controlled diagonal liftoff & 2D gear retraction
      tl.to(
        aircraftGroupRef.current,
        {
          rotation: 10.4, // Nose lifts smoothly upward around main wheels
          duration: 0.95,
          ease: "power2.inOut",
        },
        2.65
      )
        .to(
          aircraftGroupRef.current,
          {
            x: 640,
            y: 392,
            duration: 1.95,
            ease: "power2.inOut",
          },
          3.05
        )
        .to(
          runwayShadowRef.current,
          {
            attr: { cx: 650, rx: 140, ry: 6 },
            opacity: 0,
            duration: 1.35,
            ease: "power2.in",
          },
          2.95
        )
        .to(
          airportWorldRef.current,
          {
            y: 285,
            x: 210,
            opacity: 0,
            duration: 1.85,
            ease: "power2.in",
          },
          3.15
        )
        // Smooth 2D landing gear retraction after liftoff
        .to(
          noseGearRef.current,
          {
            rotation: -86,
            opacity: 0,
            duration: 0.82,
            ease: "power2.inOut",
          },
          3.68
        )
        .to(
          mainGearRef.current,
          {
            rotation: 84,
            opacity: 0,
            duration: 0.86,
            ease: "power2.inOut",
          },
          3.72
        )
        .to(
          gearDoorsRef.current,
          {
            scaleY: 0,
            opacity: 0,
            duration: 0.42,
            ease: "power2.in",
          },
          4.28
        );

      // SCENE 4 (3.55s - 5.95s): Multi-speed cloud parallax, natural climb settle & golden sunlight sweep
      tl.to(
        midCloudsRef.current,
        {
          x: 380,
          y: 72,
          opacity: 0.94,
          duration: 3.35,
          ease: "power1.out",
        },
        3.45
      )
        .to(
          foreCloudsRef.current,
          {
            x: 620,
            y: 118,
            opacity: 0.76,
            duration: 3.15,
            ease: "power1.out",
          },
          3.75
        )
        .to(
          aircraftGroupRef.current,
          {
            x: 785,
            y: 356,
            rotation: 3.8,
            scale: 0.78,
            duration: 1.85,
            ease: "sine.inOut",
          },
          4.75
        )
        .to(
          sunlightSweepRef.current,
          {
            opacity: 0.85,
            duration: 0.38,
            ease: "sine.in",
          },
          4.45
        )
        .to(
          sunlightSweepRef.current,
          {
            attr: { x: 420 },
            duration: 1.5,
            ease: "power2.inOut",
          },
          4.45
        )
        .to(
          sunlightSweepRef.current,
          {
            opacity: 0,
            duration: 0.38,
            ease: "sine.out",
          },
          5.6
        );

      // SCENE 5 (5.55s - 7.1s): Balanced final composition with Alhind Air logo & tagline inside safe area
      tl.to(
        brandingGroupRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
        },
        5.55
      ).to({}, { duration: 1.55 }, 5.55);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#EAB981] select-none"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id="alh-sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B3E6B" />
            <stop offset="28%" stopColor="#4679A8" />
            <stop offset="56%" stopColor="#B8CAD6" />
            <stop offset="76%" stopColor="#F5C98E" />
            <stop offset="92%" stopColor="#FDE4B6" />
            <stop offset="100%" stopColor="#F8D6A4" />
          </linearGradient>

          <radialGradient id="alh-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.96" />
            <stop offset="22%" stopColor="#FFE8B0" stopOpacity="0.62" />
            <stop offset="58%" stopColor="#F6B86B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F6B86B" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="alh-runway-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#464A54" />
            <stop offset="45%" stopColor="#353840" />
            <stop offset="100%" stopColor="#262930" />
          </linearGradient>

          <linearGradient id="alh-fuselage-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="58%" stopColor="#F6F9FC" />
            <stop offset="84%" stopColor="#E1E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="alh-sun-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFE7B3" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFF7DF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFE7B3" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="alh-cloud-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.95" />
            <stop offset="68%" stopColor="#FCE7C8" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#E6BA8A" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="alh-brand-scrim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDF4E3" stopOpacity="0" />
            <stop offset="42%" stopColor="#FDF4E3" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#FDF4E3" stopOpacity="0.94" />
          </linearGradient>

          <clipPath id="alh-fuselage-clip">
            <path d="M -282 -52 C -268 -86, -212 -106, -145 -106 L 145 -106 C 208 -106, 255 -94, 286 -76 C 254 -52, 198 -32, 138 -32 L -175 -32 C -234 -32, -274 -40, -282 -52 Z" />
          </clipPath>

          <clipPath id="alh-tail-clip">
            <path d="M 118 -98 L 218 -248 L 268 -248 L 252 -84 Z" />
          </clipPath>

          <filter id="alh-soft-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Golden-Hour Sky */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#alh-sky-grad)" />

        <g ref={skyCameraRef}>
          {/* Sun & Warm Atmospheric Halo */}
          <circle cx="290" cy="390" r="275" fill="url(#alh-sun-glow)" />
          <circle cx="290" cy="390" r="40" fill="#FFFBF0" opacity="0.92" />

          {/* Back Cloud Layer (Slowest Parallax) */}
          <g ref={backCloudsRef}>
            <g fill="url(#alh-cloud-grad)" opacity="0.72">
              <path d="M 80 335 Q 135 290 198 312 Q 252 272 325 308 Q 382 294 415 335 Z" />
              <path d="M 650 272 Q 715 220 795 248 Q 862 210 934 252 Q 985 242 1022 272 Z" />
              <path d="M 1170 325 Q 1235 280 1305 304 Q 1365 274 1435 325 Z" />
            </g>
          </g>

          {/* Mid Cloud Layer (Medium Parallax) */}
          <g ref={midCloudsRef}>
            <g fill="url(#alh-cloud-grad)">
              <path d="M -120 475 Q -40 408 55 442 Q 140 385 242 435 Q 315 418 365 475 Z" />
              <path d="M 460 520 Q 545 448 645 480 Q 735 432 835 484 Q 905 464 960 520 Z" />
              <path d="M 1050 462 Q 1135 398 1228 428 Q 1312 384 1408 435 Q 1468 424 1515 462 Z" />
            </g>
          </g>

          {/* Perspective 2D Airport Horizon & Runway */}
          <g ref={airportWorldRef}>
            <rect x="0" y="592" width="1600" height="54" fill="#D59D6A" opacity="0.38" />
            <g fill="#5C6475" opacity="0.78">
              <path d="M 340 632 Q 520 594 720 612 Q 900 598 1080 632 Z" />
              <rect x="375" y="620" width="675" height="15" rx="2" />
              {Array.from({ length: 16 }).map((_, idx) => (
                <rect
                  key={idx}
                  x={395 + idx * 40}
                  y="622"
                  width="24"
                  height="9"
                  fill="#FDE0AE"
                  opacity="0.35"
                />
              ))}
              <polygon points="1142,634 1156,634 1152,550 1146,550" />
              <polygon points="1134,550 1164,550 1170,535 1128,535" />
              <rect x="1147" y="520" width="4" height="15" />
              <circle cx="1149" cy="518" r="4" fill="#FFEAA0" />
            </g>

            <rect x="0" y="632" width="1600" height="268" fill="#635B4C" />
            <polygon
              points="-200,656 1800,656 1960,900 -360,900"
              fill="url(#alh-runway-grad)"
            />

            <line
              x1="-200"
              y1="664"
              x2="1800"
              y2="664"
              stroke="#F7F3EA"
              strokeOpacity="0.78"
              strokeWidth="3"
            />
            <line
              x1="-300"
              y1="836"
              x2="1900"
              y2="836"
              stroke="#F7F3EA"
              strokeOpacity="0.82"
              strokeWidth="4.2"
            />

            {/* Scrolling Runway Markings & Edge Lights */}
            <g ref={runwayMarkingsRef}>
              {Array.from({ length: 24 }).map((_, i) => {
                const x = -720 + i * 180;
                return (
                  <g key={i}>
                    <polygon
                      points={`${x},722 ${x + 92},722 ${x + 96},730 ${x - 4},730`}
                      fill="#F8F4EC"
                      opacity="0.88"
                    />
                    <circle cx={x + 30} cy={664} r="3.5" fill="#FFE7A3" />
                    <circle cx={x + 30} cy={836} r="5" fill="#FFE294" />
                    <circle
                      cx={x + 30}
                      cy={836}
                      r="11"
                      fill="#FFCA64"
                      opacity="0.25"
                    />
                  </g>
                );
              })}
            </g>

            <ellipse
              ref={runwayShadowRef}
              cx="1190"
              cy="722"
              rx="196"
              ry="10"
              fill="#14161B"
              opacity="0.48"
              filter="url(#alh-soft-blur)"
            />
          </g>

          {/* Detailed 2D Side-View Alhind Air Aircraft */}
          <g ref={aircraftGroupRef}>
            {/* Far-Side Wing Tip */}
            <polygon
              points="-24,-62 52,-62 118,-96 92,-96"
              fill="#CBD5E1"
            />

            {/* Swept 2D Vertical Tail Fin with Exact Original Alhind Air Livery */}
            <g>
              <path
                d="M 118 -98 L 218 -248 L 268 -248 L 252 -84 Z"
                fill="#F8FAFC"
              />
              <g clipPath="url(#alh-tail-clip)">
                <polygon
                  points="196,-240 275,-252 274,-238 190,-226"
                  fill="#DFB14B"
                />
                <polygon
                  points="142,-142 272,-234 268,-198 128,-120"
                  fill="#0FC2CE"
                />
                <polygon
                  points="126,-96 268,-216 244,-82 222,-82 240,-172 162,-96"
                  fill="#0A1E56"
                />
                <polygon
                  points="120,-88 198,-112 246,-80 120,-80"
                  fill="#0FC2CE"
                />
              </g>
            </g>

            {/* Retractable 2D Nose Gear with High-Contrast Rotating Spokes */}
            <g ref={noseGearRef}>
              <line
                x1="-192"
                y1="-52"
                x2="-192"
                y2="-13"
                stroke="#94A3B8"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <line
                x1="-192"
                y1="-34"
                x2="-178"
                y2="-48"
                stroke="#64748B"
                strokeWidth="2.5"
              />
              <g ref={noseWheelRef} transform="translate(-192, -13)">
                <circle r="11.5" fill="#181C24" />
                <circle r="6.5" fill="#E2E8F0" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="#0A1E56" strokeWidth="2.4" />
                <line x1="0" y1="-6" x2="0" y2="6" stroke="#0A1E56" strokeWidth="2.4" />
              </g>
            </g>

            {/* Retractable 2D Main Gear Bogie with Visibly Rotating Dual Wheels */}
            <g ref={mainGearRef}>
              <line
                x1="41"
                y1="-56"
                x2="41"
                y2="-16"
                stroke="#94A3B8"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="24"
                y1="-16"
                x2="58"
                y2="-16"
                stroke="#64748B"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <g ref={mainWheelFrontRef} transform="translate(26, -16)">
                <circle r="15" fill="#161920" />
                <circle r="8" fill="#E2E8F0" />
                <line x1="-7.5" y1="0" x2="7.5" y2="0" stroke="#0A1E56" strokeWidth="2.6" />
                <line x1="0" y1="-7.5" x2="0" y2="7.5" stroke="#0A1E56" strokeWidth="2.6" />
              </g>
              <g ref={mainWheelRearRef} transform="translate(56, -16)">
                <circle r="15" fill="#161920" />
                <circle r="8" fill="#E2E8F0" />
                <line x1="-7.5" y1="0" x2="7.5" y2="0" stroke="#0A1E56" strokeWidth="2.6" />
                <line x1="0" y1="-7.5" x2="0" y2="7.5" stroke="#0A1E56" strokeWidth="2.6" />
              </g>
            </g>

            {/* Wheel-Well Bay Doors */}
            <g ref={gearDoorsRef}>
              <rect x="-204" y="-50" width="22" height="9" rx="1.5" fill="#CBD5E1" />
              <rect x="24" y="-52" width="34" height="11" rx="2" fill="#CBD5E1" />
            </g>

            {/* Main Fuselage */}
            <path
              d="M -282 -52 C -268 -86, -212 -106, -145 -106 L 145 -106 C 208 -106, 255 -94, 286 -76 C 254 -52, 198 -32, 138 -32 L -175 -32 C -234 -32, -274 -40, -282 -52 Z"
              fill="url(#alh-fuselage-grad)"
            />

            <g clipPath="url(#alh-fuselage-clip)">
              <path
                d="M -262 -68 L -230 -80 L -222 -66 L -258 -61 Z"
                fill="#101E33"
              />
              <line
                x1="-243"
                y1="-76"
                x2="-239"
                y2="-63"
                stroke="#E2E8F0"
                strokeWidth="1.6"
              />
              <rect
                x="-196"
                y="-90"
                width="18"
                height="38"
                rx="4"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <rect
                x="166"
                y="-88"
                width="16"
                height="34"
                rx="4"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <g transform="translate(-214, -74)">
                <rect x="0" y="0" width="11" height="2.4" fill="#FF671F" />
                <rect x="0" y="2.4" width="11" height="2.4" fill="#FFFFFF" />
                <rect x="0" y="4.8" width="11" height="2.4" fill="#046A38" />
              </g>
              <image
                href="/extracted/alhind-logo-clean.webp"
                x="-172"
                y="-97"
                width="126"
                height="37"
                preserveAspectRatio="xMidYMid meet"
              />
              {Array.from({ length: 25 }).map((_, wIdx) => (
                <rect
                  key={wIdx}
                  x={-140 + wIdx * 11.8}
                  y="-65"
                  width="5.2"
                  height="8.2"
                  rx="2.4"
                  fill="#1B2A42"
                />
              ))}
              <rect
                ref={sunlightSweepRef}
                x="-420"
                y="-115"
                width="180"
                height="95"
                transform="skewX(-22)"
                fill="url(#alh-sun-sheen)"
                opacity="0"
              />
            </g>

            {/* Horizontal Stabilizer, Swept Wing + Turquoise Winglet & Turbofan */}
            <polygon
              points="182,-76 248,-76 276,-64 236,-64"
              fill="#DCE4EE"
            />
            <polygon
              points="-42,-52 58,-52 178,-22 138,-22"
              fill="#E6ECF4"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <polygon
              points="138,-22 178,-22 192,-44 172,-44"
              fill="#0FC2CE"
            />
            <ellipse
              ref={engineShimmerRef}
              cx="66"
              cy="-28"
              rx="48"
              ry="9"
              fill="#FFE29E"
              opacity="0.2"
              filter="url(#alh-soft-blur)"
            />
            <g transform="translate(-28, -28)">
              <rect x="-32" y="-15" width="66" height="30" rx="11" fill="#F8FAFC" />
              <rect x="-32" y="2" width="66" height="13" rx="6" fill="#0A1E56" opacity="0.16" />
              <rect x="-35" y="-14" width="6" height="28" rx="2.5" fill="#94A3B8" />
              <polygon points="34,-10 48,-6 48,6 34,10" fill="#64748B" />
            </g>
          </g>

          {/* Foreground Cloud Layer (Fastest Parallax) */}
          <g ref={foreCloudsRef} opacity="0">
            <g fill="#FFF7E8" opacity="0.68" filter="url(#alh-soft-blur)">
              <path d="M -280 555 Q -165 485 -40 522 Q 75 470 195 528 Q 285 505 355 555 Z" />
              <path d="M 520 585 Q 635 510 765 548 Q 885 495 1015 552 Q 1105 530 1185 585 Z" />
            </g>
          </g>
        </g>

        {/* Scene 5: Proportional SVG Safe-Area Alhind Air Branding & Tagline */}
        <g ref={brandingGroupRef} opacity="0">
          <rect x="0" y="640" width="1600" height="260" fill="url(#alh-brand-scrim)" />
          <image
            href="/extracted/alhind-logo-clean.webp"
            x="676"
            y="686"
            width="248"
            height="72"
            preserveAspectRatio="xMidYMid meet"
          />
          <rect x="772" y="772" width="56" height="3.2" rx="1.6" fill="#0FC2CE" />
          <text
            x="800"
            y="814"
            textAnchor="middle"
            fill="#0A1E56"
            fontSize="27"
            fontWeight="500"
            letterSpacing="0.8"
          >
            Where every journey feels closer.
          </text>
        </g>
      </svg>
    </div>
  );
}
