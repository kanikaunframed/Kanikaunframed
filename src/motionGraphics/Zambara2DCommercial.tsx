import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Commercial2DProps } from "./Raymond2DCommercial";

/**
 * PROJECT 04 — ZAMBARA ALCOHOL
 * Elegant Dark Luxury 2D Beverage Commercial (Refined for Compact 16:9 Window)
 * - Preserves authentic Zambara bottle & label proportions with smooth, controlled 2D pour tilt.
 * - Replaces thin wireframe glass with a rich multi-layered 2D crystal tumbler illustration
 *   (curved lip & sham base, translucent shaded side walls, soft side reflections & faceted ice).
 * - Wider, tapered golden-amber liquid stream with organic curved edges, highlight streaks
 *   & animated 2D impact splash where the stream enters the glass.
 * - Clipping-mask glass fill rising smoothly with a curved top meniscus, ripples & natural settle.
 * - Balanced final luxury framing showing upright bottle, filled glass, authentic Zambara sun-crest
 *   & "THE SPIRIT OF AFRICA" cleanly inside the compact 16:9 safe area.
 */
export function Zambara2DCommercial({
  reducedMotion,
  onComplete,
}: Commercial2DProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cameraGroupRef = useRef<SVGGElement | null>(null);
  const ambientGlowRef = useRef<SVGGElement | null>(null);
  const bottleEntranceGroupRef = useRef<SVGGElement | null>(null);
  const bottleRimSweepRef = useRef<SVGRectElement | null>(null);
  const bottlePivotGroupRef = useRef<SVGGElement | null>(null);
  const bottleCapRef = useRef<SVGGElement | null>(null);
  const bottleShadowRef = useRef<SVGEllipseElement | null>(null);

  const glassGroupRef = useRef<SVGGElement | null>(null);
  const glassShadowRef = useRef<SVGEllipseElement | null>(null);
  const glassBaseGlowRef = useRef<SVGEllipseElement | null>(null);
  const backWavePathRef = useRef<SVGPathElement | null>(null);
  const frontLiquidPathRef = useRef<SVGPathElement | null>(null);
  const curvedMeniscusRef = useRef<SVGEllipseElement | null>(null);
  const meniscusRimPathRef = useRef<SVGPathElement | null>(null);
  const rippleOuterRef = useRef<SVGEllipseElement | null>(null);
  const rippleInnerRef = useRef<SVGEllipseElement | null>(null);
  const impactCrownPathRef = useRef<SVGPathElement | null>(null);
  const realisticLiqueurTexRef = useRef<SVGImageElement | null>(null);
  const iceLeftRef = useRef<SVGGElement | null>(null);
  const iceRightRef = useRef<SVGGElement | null>(null);

  const pourOuterPathRef = useRef<SVGPathElement | null>(null);
  const pourMidHighlightRef = useRef<SVGPathElement | null>(null);
  const pourSpecStreakRef = useRef<SVGPathElement | null>(null);
  const dropOneRef = useRef<SVGCircleElement | null>(null);
  const dropTwoRef = useRef<SVGCircleElement | null>(null);

  const brandGroupRef = useRef<SVGGElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    // Compact 16:9 Safe-Area Composition (1600x900):
    // Upright bottle centred at x = 1015, y = 148..716 (height = 568, width = 148).
    // Layered 2D crystal tumbler centred at x = 746 (x = 650..842, y = 516..716).
    // Final Zambara sun-crest + tagline sits cleanly in left safe space (cx = 375, y = 240..570).
    const PIVOT_X = 1015;
    const PIVOT_Y = 448;
    // Exact lower pouring lip of the open 53px bottle neck (x=988..1041, y=188) when tilted left
    const SPOUT_LOCAL_X = 995;
    const SPOUT_LOCAL_Y = 191;

    const GLASS_LEFT = 654;
    const GLASS_RIGHT = 838;
    const GLASS_CENTER_X = 746;
    const GLASS_BOTTOM_Y = 682;
    const GLASS_FULL_Y = 568;

    const sim = {
      bottleAngle: 0, // Controlled natural tilt (-58 deg max)
      bottleX: 0,
      bottleY: 0,
      pourHead: 0,
      pourTail: 0,
      pourWidth: 0,
      fillLevel: 0,
      waveAmp: 0,
      wavePhase: 0,
      splashAmp: 0,
    };

    const sampleCubic = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      return {
        x:
          uu * u * p0.x +
          3 * uu * t * p1.x +
          3 * u * tt * p2.x +
          tt * t * p3.x,
        y:
          uu * u * p0.y +
          3 * uu * t * p1.y +
          3 * u * tt * p2.y +
          tt * t * p3.y,
      };
    };

    const syncSceneGeometry = () => {
      // 1. Bottle 2D transform
      if (bottlePivotGroupRef.current) {
        bottlePivotGroupRef.current.setAttribute(
          "transform",
          `translate(${sim.bottleX.toFixed(2)} ${sim.bottleY.toFixed(
            2
          )}) rotate(${sim.bottleAngle.toFixed(2)} ${PIVOT_X} ${PIVOT_Y})`
        );
      }

      // 2. Rising clipped liquid level + curved top meniscus & subtle ripples
      const surfaceY = gsap.utils.interpolate(
        GLASS_BOTTOM_Y + 6,
        GLASS_FULL_Y,
        sim.fillLevel
      );
      const amp = sim.waveAmp;
      const ph = sim.wavePhase;

      const samples = 18;
      let frontWaveD = `M ${GLASS_LEFT - 14} ${GLASS_BOTTOM_Y + 24} L ${
        GLASS_LEFT - 14
      } ${surfaceY.toFixed(2)}`;
      let backWaveD = `M ${GLASS_LEFT - 14} ${GLASS_BOTTOM_Y + 24} L ${
        GLASS_LEFT - 14
      } ${(surfaceY - 5).toFixed(2)}`;
      let meniscusRimD = "";

      for (let i = 0; i <= samples; i++) {
        const ratio = i / samples;
        const x = gsap.utils.interpolate(
          GLASS_LEFT - 10,
          GLASS_RIGHT + 10,
          ratio
        );
        // Natural curved meniscus dip/arch across cylindrical glass + gentle ripple wave
        const curveArch = Math.sin(ratio * Math.PI) * 3.8;
        const fy =
          surfaceY +
          curveArch * 0.45 +
          Math.sin(ratio * Math.PI * 2.2 + ph) * amp +
          Math.cos(ratio * Math.PI * 3.8 - ph * 1.25) * (amp * 0.32);
        const by =
          surfaceY -
          5.5 -
          curveArch * 0.55 +
          Math.sin(ratio * Math.PI * 2.0 - ph * 0.85 + 1.0) * (amp * 0.78);

        frontWaveD += ` L ${x.toFixed(2)} ${fy.toFixed(2)}`;
        backWaveD += ` L ${x.toFixed(2)} ${by.toFixed(2)}`;
        meniscusRimD += `${i === 0 ? "M" : " L"} ${x.toFixed(2)} ${fy.toFixed(
          2
        )}`;
      }

      frontWaveD += ` L ${GLASS_RIGHT + 14} ${GLASS_BOTTOM_Y + 24} Z`;
      backWaveD += ` L ${GLASS_RIGHT + 14} ${GLASS_BOTTOM_Y + 24} Z`;

      const visibleFill = sim.fillLevel > 0.01;
      frontLiquidPathRef.current?.setAttribute("d", frontWaveD);
      frontLiquidPathRef.current?.setAttribute(
        "opacity",
        visibleFill ? "1" : "0"
      );
      backWavePathRef.current?.setAttribute("d", backWaveD);
      backWavePathRef.current?.setAttribute(
        "opacity",
        visibleFill ? "0.95" : "0"
      );
      meniscusRimPathRef.current?.setAttribute("d", meniscusRimD);
      meniscusRimPathRef.current?.setAttribute(
        "opacity",
        sim.fillLevel > 0.02 ? "0.85" : "0"
      );

      if (curvedMeniscusRef.current) {
        curvedMeniscusRef.current.setAttribute("cy", (surfaceY - 1.5).toFixed(2));
        curvedMeniscusRef.current.setAttribute(
          "ry",
          (6.2 + amp * 0.35).toFixed(2)
        );
        curvedMeniscusRef.current.setAttribute(
          "opacity",
          sim.fillLevel > 0.03 ? "0.52" : "0"
        );
      }

      // Subtle photographic marula-cream swirl shading rising inside the liquid mask
      if (realisticLiqueurTexRef.current) {
        realisticLiqueurTexRef.current.setAttribute(
          "opacity",
          (Math.min(1, sim.fillLevel * 1.25) * 0.34).toFixed(2)
        );
      }

      // Buoyant 2D crystal ice cubes
      const iceRise = Math.max(0, sim.fillLevel - 0.18) * 58;
      const bobL = Math.sin(ph * 0.62) * (1.1 + amp * 0.2);
      const bobR = Math.cos(ph * 0.56 + 0.8) * (1.1 + amp * 0.18);
      iceLeftRef.current?.setAttribute(
        "transform",
        `translate(686 ${(626 - iceRise + bobL).toFixed(2)}) rotate(${(
          -9 +
          sim.fillLevel * 5 +
          bobL * 0.4
        ).toFixed(2)} 30 26)`
      );
      iceRightRef.current?.setAttribute(
        "transform",
        `translate(748 ${(630 - iceRise * 0.92 + bobR).toFixed(2)}) rotate(${(
          12 -
          sim.fillLevel * 4.5 +
          bobR * 0.4
        ).toFixed(2)} 28 24)`
      );

      glassBaseGlowRef.current?.setAttribute(
        "opacity",
        (0.16 + sim.fillLevel * 0.62).toFixed(2)
      );

      // 3. Exact rotated bottle spout coordinates & wider tapered organic pour stream
      const rad = (sim.bottleAngle * Math.PI) / 180;
      const dx = SPOUT_LOCAL_X - PIVOT_X;
      const dy = SPOUT_LOCAL_Y - PIVOT_Y;
      const spoutX =
        PIVOT_X + sim.bottleX + dx * Math.cos(rad) - dy * Math.sin(rad);
      const spoutY =
        PIVOT_Y + sim.bottleY + dx * Math.sin(rad) + dy * Math.cos(rad);

      const impactX = GLASS_CENTER_X + 10 + Math.sin(ph * 0.75) * 2.4;
      const impactY = Math.min(surfaceY + 2, GLASS_BOTTOM_Y - 2);

      // Surface ripples & small 2D liquid impact splash where stream enters glass
      const ripPulse = 0.85 + Math.sin(ph * 1.6) * 0.22;
      if (rippleOuterRef.current) {
        rippleOuterRef.current.setAttribute("cx", impactX.toFixed(2));
        rippleOuterRef.current.setAttribute("cy", surfaceY.toFixed(2));
        rippleOuterRef.current.setAttribute(
          "rx",
          (34 * ripPulse).toFixed(2)
        );
        rippleOuterRef.current.setAttribute(
          "ry",
          (5.8 * ripPulse).toFixed(2)
        );
        rippleOuterRef.current.setAttribute(
          "opacity",
          (sim.splashAmp * 0.65).toFixed(2)
        );
      }
      if (rippleInnerRef.current) {
        rippleInnerRef.current.setAttribute("cx", impactX.toFixed(2));
        rippleInnerRef.current.setAttribute("cy", surfaceY.toFixed(2));
        rippleInnerRef.current.setAttribute(
          "rx",
          (16 * (1.7 - ripPulse * 0.7)).toFixed(2)
        );
        rippleInnerRef.current.setAttribute(
          "ry",
          (3.2 * (1.7 - ripPulse * 0.7)).toFixed(2)
        );
        rippleInnerRef.current.setAttribute(
          "opacity",
          (sim.splashAmp * 0.82).toFixed(2)
        );
      }

      if (impactCrownPathRef.current) {
        if (sim.splashAmp > 0.04) {
          const ch = (11 + Math.sin(ph * 2.3) * 3.5) * sim.splashAmp;
          const ch2 = (9 + Math.cos(ph * 2.1) * 3.2) * sim.splashAmp;
          const crownD = `M ${(impactX - 18).toFixed(2)} ${(
            surfaceY + 2
          ).toFixed(2)} C ${(impactX - 24).toFixed(2)} ${(
            surfaceY - ch
          ).toFixed(2)}, ${(impactX - 10).toFixed(2)} ${(
            surfaceY - ch * 1.15
          ).toFixed(2)}, ${(impactX - 5).toFixed(2)} ${(surfaceY + 1).toFixed(
            2
          )} L ${(impactX + 5).toFixed(2)} ${(surfaceY + 1).toFixed(2)} C ${(
            impactX + 11
          ).toFixed(2)} ${(surfaceY - ch2 * 1.2).toFixed(2)}, ${(
            impactX + 25
          ).toFixed(2)} ${(surfaceY - ch2).toFixed(2)}, ${(
            impactX + 18
          ).toFixed(2)} ${(surfaceY + 2).toFixed(2)} Z`;
          impactCrownPathRef.current.setAttribute("d", crownD);
          impactCrownPathRef.current.setAttribute(
            "opacity",
            (sim.splashAmp * 0.92).toFixed(2)
          );
        } else {
          impactCrownPathRef.current.setAttribute("d", "");
          impactCrownPathRef.current.setAttribute("opacity", "0");
        }
      }

      const activeSpan = sim.pourHead - sim.pourTail;
      if (activeSpan <= 0.015 || sim.pourWidth <= 0.02) {
        pourOuterPathRef.current?.setAttribute("d", "");
        pourMidHighlightRef.current?.setAttribute("d", "");
        pourSpecStreakRef.current?.setAttribute("d", "");
        return;
      }

      const p0 = { x: spoutX, y: spoutY };
      const p1 = { x: spoutX - 38, y: spoutY + 22 };
      const p2 = { x: impactX + 8, y: spoutY + (impactY - spoutY) * 0.45 };
      const p3 = { x: impactX, y: impactY };

      const segs = 22;
      const leftPts: Array<{ x: number; y: number }> = [];
      const rightPts: Array<{ x: number; y: number }> = [];
      const midPts: Array<{ x: number; y: number }> = [];
      const specPts: Array<{ x: number; y: number }> = [];

      for (let i = 0; i <= segs; i++) {
        const s = i / segs;
        const t = gsap.utils.interpolate(sim.pourTail, sim.pourHead, s);
        const pt = sampleCubic(p0, p1, p2, p3, t);
        const nextPt = sampleCubic(
          p0,
          p1,
          p2,
          p3,
          Math.min(1, t + 0.02)
        );
        const tx = nextPt.x - pt.x;
        const ty = nextPt.y - pt.y;
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;

        // Wider, creamy tapered amber stream: ~11.5px half-width (23px wide!) near spout tapering smoothly to ~6px (12px wide) at glass
        const taperProfile =
          sim.pourTail > 0.01
            ? Math.sin(s * Math.PI) * 0.95
            : gsap.utils.interpolate(1.08, 0.56, Math.pow(s, 0.72));
        const organicEdgeL = Math.sin(t * 9.5 - ph * 1.8) * 1.35;
        const organicEdgeR = Math.cos(t * 10.5 - ph * 1.65 + 0.7) * 1.25;

        const halfWL = Math.max(
          1.6,
          (11.2 * taperProfile + organicEdgeL) * sim.pourWidth
        );
        const halfWR = Math.max(
          1.6,
          (11.2 * taperProfile + organicEdgeR) * sim.pourWidth
        );

        leftPts.push({ x: pt.x + nx * halfWL, y: pt.y + ny * halfWL });
        rightPts.push({ x: pt.x - nx * halfWR, y: pt.y - ny * halfWR });
        midPts.push({
          x: pt.x + nx * (halfWL * 0.12),
          y: pt.y + ny * (halfWL * 0.12),
        });
        specPts.push({
          x: pt.x + nx * (halfWL * 0.44),
          y: pt.y + ny * (halfWL * 0.44),
        });
      }

      let outerD = `M ${leftPts[0].x.toFixed(2)} ${leftPts[0].y.toFixed(2)}`;
      for (let i = 1; i < leftPts.length; i++) {
        outerD += ` L ${leftPts[i].x.toFixed(2)} ${leftPts[i].y.toFixed(2)}`;
      }
      for (let i = rightPts.length - 1; i >= 0; i--) {
        outerD += ` L ${rightPts[i].x.toFixed(2)} ${rightPts[i].y.toFixed(2)}`;
      }
      outerD += " Z";

      let midD = `M ${midPts[0].x.toFixed(2)} ${midPts[0].y.toFixed(2)}`;
      let specD = `M ${specPts[0].x.toFixed(2)} ${specPts[0].y.toFixed(2)}`;
      for (let i = 1; i < midPts.length; i++) {
        midD += ` L ${midPts[i].x.toFixed(2)} ${midPts[i].y.toFixed(2)}`;
        specD += ` L ${specPts[i].x.toFixed(2)} ${specPts[i].y.toFixed(2)}`;
      }

      pourOuterPathRef.current?.setAttribute("d", outerD);
      pourMidHighlightRef.current?.setAttribute("d", midD);
      pourSpecStreakRef.current?.setAttribute("d", specD);
    };

    syncSceneGeometry();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: syncSceneGeometry,
        onComplete: finish,
      });

      if (reducedMotion) {
        sim.fillLevel = 0.72;
        sim.waveAmp = 1.0;
        syncSceneGeometry();
        gsap.set(ambientGlowRef.current, { opacity: 0.95 });
        gsap.set(bottleEntranceGroupRef.current, { opacity: 1, y: 0 });
        gsap.set(glassGroupRef.current, { opacity: 1, x: 0 });
        gsap.set(glassShadowRef.current, { opacity: 0.72, x: 0 });
        tl.fromTo(
          brandGroupRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0.9
        ).to({}, { duration: 1.2 }, 1.8);
        return;
      }

      // Initial state: full upright bottle emerges smoothly from warm shadow (never sliced in half)
      gsap.set(ambientGlowRef.current, {
        opacity: 0.28,
        scale: 0.92,
        svgOrigin: "840 460",
      });
      gsap.set(bottleEntranceGroupRef.current, { opacity: 0, y: 18 });
      gsap.set(bottleRimSweepRef.current, { attr: { x: 910 }, opacity: 0 });
      gsap.set(bottleShadowRef.current, { opacity: 0.14 });
      gsap.set(glassGroupRef.current, { opacity: 0, x: -28 });
      gsap.set(glassShadowRef.current, { opacity: 0, x: -28 });
      gsap.set(bottleCapRef.current, { y: 0, rotation: 0, opacity: 1 });
      gsap.set([dropOneRef.current, dropTwoRef.current], { opacity: 0 });
      gsap.set(brandGroupRef.current, { opacity: 0, y: 16 });
      gsap.set(cameraGroupRef.current, {
        scale: 1.03,
        x: -60,
        y: 0,
        svgOrigin: "880 450",
      });

      // Continuous gentle liquid phase
      tl.to(
        sim,
        {
          wavePhase: Math.PI * 14,
          duration: 6.45,
          ease: "none",
        },
        0
      );

      // SCENE 1 & 2 (0.0s - 1.85s): Dark earthy luxury reveal + smooth full-bottle emergence & warm rim light
      tl.to(
        ambientGlowRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 1.05,
          ease: "power2.out",
        },
        0
      )
        .to(
          bottleEntranceGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 1.05,
            ease: "power3.out",
          },
          0.16
        )
        .to(
          bottleRimSweepRef.current,
          { opacity: 0.55, duration: 0.35, ease: "sine.out" },
          0.42
        )
        .to(
          bottleRimSweepRef.current,
          {
            attr: { x: 1110 },
            duration: 1.15,
            ease: "power2.inOut",
          },
          0.42
        )
        .to(
          bottleRimSweepRef.current,
          { opacity: 0, duration: 0.35, ease: "sine.out" },
          1.25
        )
        .to(
          bottleShadowRef.current,
          { opacity: 0.82, duration: 1.05, ease: "power2.out" },
          0.25
        )
        // Layered 2D crystal tumbler glides smoothly into place beside bottle
        .to(
          [glassGroupRef.current, glassShadowRef.current],
          {
            opacity: 1,
            x: 0,
            duration: 0.95,
            ease: "power3.out",
          },
          0.95
        );

      // SCENE 3 (1.82s - 2.95s): Controlled smooth bottle tilt (-58 deg max) & wider golden-amber pour stream
      tl.to(
        bottleCapRef.current,
        {
          y: -48,
          rotation: 6,
          opacity: 0,
          duration: 0.44,
          ease: "power2.in",
        },
        1.8
      )
        .to(
          sim,
          {
            bottleX: -36,
            bottleY: -22,
            bottleAngle: -56.5, // Smooth, controlled pour angle — never excessive!
            duration: 0.92,
            ease: "power2.inOut",
          },
          1.94
        )
        .to(
          bottleShadowRef.current,
          {
            attr: { rx: 64 },
            opacity: 0.36,
            duration: 0.85,
            ease: "power2.inOut",
          },
          1.94
        )
        .to(
          sim,
          {
            pourWidth: 1,
            pourHead: 1,
            duration: 0.36,
            ease: "power2.in",
          },
          2.48
        );

      // SCENE 4 (2.78s - 4.4s): Clipped liquid rises gradually with curved meniscus, splash crown & ripples
      tl.to(
        sim,
        {
          waveAmp: 4.8,
          splashAmp: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        2.78
      )
        .to(
          sim,
          {
            fillLevel: 0.74,
            duration: 1.58,
            ease: "sine.inOut",
          },
          2.8
        )
        .to(
          sim,
          {
            bottleAngle: -59,
            duration: 1.35,
            ease: "sine.inOut",
          },
          2.85
        );

      // SCENE 5 (4.3s - 5.3s): Bottle returns upright, stream tapers & stops, liquid settles
      tl.to(
        sim,
        {
          bottleAngle: 0,
          bottleX: 0,
          bottleY: 0,
          duration: 0.92,
          ease: "power3.inOut",
        },
        4.3
      )
        .to(
          sim,
          {
            pourTail: 1,
            pourWidth: 0.2,
            splashAmp: 0,
            duration: 0.36,
            ease: "power2.in",
          },
          4.34
        )
        .fromTo(
          dropOneRef.current,
          { attr: { cx: 760, cy: 486 }, opacity: 0.95 },
          {
            attr: { cx: 754, cy: 572 },
            opacity: 0,
            duration: 0.32,
            ease: "power2.in",
            immediateRender: false,
          },
          4.54
        )
        .fromTo(
          dropTwoRef.current,
          { attr: { cx: 766, cy: 506 }, opacity: 0.85 },
          {
            attr: { cx: 758, cy: 574 },
            opacity: 0,
            duration: 0.28,
            ease: "power2.in",
            immediateRender: false,
          },
          4.66
        )
        .fromTo(
          bottleCapRef.current,
          { y: -36, rotation: 0, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.44,
            ease: "back.out(1.35)",
            immediateRender: false,
          },
          4.92
        )
        .to(
          bottleShadowRef.current,
          {
            attr: { rx: 94 },
            opacity: 0.82,
            duration: 0.85,
            ease: "power2.out",
          },
          4.42
        )
        .to(
          sim,
          {
            waveAmp: 0.75,
            duration: 1.15,
            ease: "power2.out",
          },
          4.52
        );

      // SCENE 6 (4.8s - 6.45s): Balanced luxury final frame with Zambara logo & "THE SPIRIT OF AFRICA"
      tl.to(
        cameraGroupRef.current,
        {
          scale: 1,
          x: 52, // Shifts bottle+glass gently right-of-centre to balance left-side Zambara crest lockup
          y: 0,
          duration: 1.15,
          ease: "power2.inOut",
        },
        4.75
      )
        .to(
          brandGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.88,
            ease: "power3.out",
          },
          5.05
        )
        .to({}, { duration: 1.4 }, 5.05);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#120B07] select-none"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          <radialGradient id="zam-studio-bg" cx="54%" cy="46%" r="66%">
            <stop offset="0%" stopColor="#3D2514" />
            <stop offset="48%" stopColor="#21130B" />
            <stop offset="100%" stopColor="#0E0805" />
          </radialGradient>

          <radialGradient id="zam-amber-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5B95A" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#B86B23" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#120B07" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="zam-stone-table" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#271911" />
            <stop offset="38%" stopColor="#1A100B" />
            <stop offset="100%" stopColor="#0C0704" />
          </linearGradient>

          <pattern
            id="zam-stone-grain"
            width="180"
            height="90"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 28 Q 48 21, 96 31 T 180 26 M 18 68 Q 76 59, 134 72 T 180 65"
              fill="none"
              stroke="#D89D56"
              strokeOpacity="0.05"
              strokeWidth="1.1"
            />
          </pattern>

          {/* Natural Shaded 2D Crystal Tumbler Body & Wall Gradients */}
          <linearGradient id="zam-glass-body" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFEAC7" stopOpacity="0.24" />
            <stop offset="14%" stopColor="#F7D399" stopOpacity="0.09" />
            <stop offset="50%" stopColor="#2B190E" stopOpacity="0.18" />
            <stop offset="86%" stopColor="#F7D399" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFEAC7" stopOpacity="0.22" />
          </linearGradient>

          <linearGradient id="zam-glass-sham" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFE5B8" stopOpacity="0.36" />
            <stop offset="22%" stopColor="#8C5824" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#F7C578" stopOpacity="0.26" />
            <stop offset="78%" stopColor="#7A4B1C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFE5B8" stopOpacity="0.34" />
          </linearGradient>

          <linearGradient id="zam-wall-pillar-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.46" />
            <stop offset="60%" stopColor="#FFEAC4" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#FFEAC4" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="zam-wall-pillar-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFE5B4" stopOpacity="0.36" />
            <stop offset="65%" stopColor="#FFD996" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFD996" stopOpacity="0" />
          </linearGradient>

          {/* Creamy Golden-Amber Marula Liqueur Gradients */}
          <linearGradient id="zam-liqueur-front" x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="#F5D396" />
            <stop offset="44%" stopColor="#DD9F50" />
            <stop offset="84%" stopColor="#B8742B" />
            <stop offset="100%" stopColor="#8F5117" />
          </linearGradient>

          <linearGradient id="zam-liqueur-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CC8B3E" />
            <stop offset="100%" stopColor="#7E4512" />
          </linearGradient>

          <radialGradient id="zam-meniscus-top" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFF5DD" stopOpacity="0.92" />
            <stop offset="65%" stopColor="#ECC17C" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#D49547" stopOpacity="0.65" />
          </radialGradient>

          <linearGradient id="zam-pour-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCE3B4" />
            <stop offset="48%" stopColor="#DF9F4D" />
            <stop offset="100%" stopColor="#B56F24" />
          </linearGradient>

          <linearGradient id="zam-rim-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF0C9" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFE19C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFF0C9" stopOpacity="0" />
          </linearGradient>

          <clipPath id="zam-bottle-uncapped-clip">
            <rect x="920" y="191" width="190" height="536" />
          </clipPath>

          {/* Curved Crystal Tumbler Interior Liquid Clipping Mask */}
          <clipPath id="zam-glass-interior-clip">
            <path d="M 659 524 L 833 524 L 822 674 Q 820 684 806 684 L 686 684 Q 672 684 670 674 Z" />
          </clipPath>

          <linearGradient id="zam-gold-cap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7E571C" />
            <stop offset="28%" stopColor="#E6C173" />
            <stop offset="52%" stopColor="#FFF0C2" />
            <stop offset="78%" stopColor="#C99842" />
            <stop offset="100%" stopColor="#6D4814" />
          </linearGradient>

          <linearGradient id="zam-ice-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#F5D7A6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C68B42" stopOpacity="0.18" />
          </linearGradient>

          <filter id="zam-soft-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
          <filter id="zam-beam-blur" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Dark Earthy Studio & Stone Tabletop */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#zam-studio-bg)" />

        <g ref={ambientGlowRef}>
          <ellipse cx="860" cy="450" rx="520" ry="320" fill="url(#zam-amber-halo)" />
        </g>

        <rect x="0" y="684" width="1600" height="216" fill="url(#zam-stone-table)" />
        <rect x="0" y="684" width="1600" height="216" fill="url(#zam-stone-grain)" />
        <line
          x1="0"
          y1="684"
          x2="1600"
          y2="684"
          stroke="#F6C980"
          strokeOpacity="0.14"
          strokeWidth="1.2"
        />

        <g ref={cameraGroupRef}>
          {/* Tabletop Shadows */}
          <ellipse
            ref={glassShadowRef}
            cx="746"
            cy="718"
            rx="104"
            ry="14"
            fill="#050301"
            opacity="0.72"
            filter="url(#zam-soft-blur)"
          />
          <ellipse
            ref={bottleShadowRef}
            cx="1015"
            cy="718"
            rx="94"
            ry="15"
            fill="#050301"
            opacity="0.82"
            filter="url(#zam-soft-blur)"
          />
          <ellipse
            ref={glassBaseGlowRef}
            cx="746"
            cy="714"
            rx="82"
            ry="10"
            fill="#E5A249"
            opacity="0.16"
            filter="url(#zam-beam-blur)"
          />

          {/* Multi-Layered 2D Crystal Rocks Tumbler */}
          <g ref={glassGroupRef}>
            {/* 1. Shaded Translucent Outer Glass Silhouette */}
            <path
              d="M 652 520 L 840 520 L 827 704 Q 824 716 806 716 L 686 716 Q 668 716 665 704 Z"
              fill="url(#zam-glass-body)"
            />

            {/* Back Rim Curve */}
            <path
              d="M 652 520 A 94 7.5 0 0 1 840 520"
              fill="none"
              stroke="#FFE7BE"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />

            {/* 2. Clipped Interior: Rising Wave-Masked Liqueur, Ice, Curved Meniscus & Ripples */}
            <g clipPath="url(#zam-glass-interior-clip)">
              <path
                ref={backWavePathRef}
                d=""
                fill="url(#zam-liqueur-back)"
                opacity="0"
              />

              {/* Faceted Translucent 2D Ice Cubes */}
              <g ref={iceLeftRef} transform="translate(686 626) rotate(-9 30 26)">
                <rect
                  x="0"
                  y="0"
                  width="58"
                  height="50"
                  rx="10"
                  fill="url(#zam-ice-grad)"
                />
                <path
                  d="M 8 12 L 30 7 L 48 15 M 10 38 L 35 42"
                  fill="none"
                  stroke="#FFFDF9"
                  strokeOpacity="0.44"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </g>
              <g ref={iceRightRef} transform="translate(748 630) rotate(12 28 24)">
                <rect
                  x="0"
                  y="0"
                  width="54"
                  height="46"
                  rx="9"
                  fill="url(#zam-ice-grad)"
                />
                <path
                  d="M 9 13 L 32 9 L 45 20"
                  fill="none"
                  stroke="#FFFDF9"
                  strokeOpacity="0.4"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Main Creamy Golden-Amber Fill */}
              <path
                ref={frontLiquidPathRef}
                d=""
                fill="url(#zam-liqueur-front)"
                opacity="0"
              />

              {/* Subtle Creamy Swirl Shading Blended Inside Clipped Liquid */}
              <image
                ref={realisticLiqueurTexRef}
                href="/extracted/zambara-glass.webp"
                x="648"
                y="516"
                width="196"
                height="204"
                preserveAspectRatio="none"
                opacity="0"
              />

              {/* Curved Top Surface Meniscus & Concentric Pour Ripples */}
              <ellipse
                ref={curvedMeniscusRef}
                cx="746"
                cy="620"
                rx="88"
                ry="6.2"
                fill="url(#zam-meniscus-top)"
                opacity="0"
              />
              <path
                ref={meniscusRimPathRef}
                d=""
                fill="none"
                stroke="#FFF6E0"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0"
              />
              <ellipse
                ref={rippleOuterRef}
                cx="756"
                cy="620"
                rx="34"
                ry="5.8"
                fill="none"
                stroke="#FFF5DC"
                strokeWidth="1.5"
                opacity="0"
              />
              <ellipse
                ref={rippleInnerRef}
                cx="756"
                cy="620"
                rx="16"
                ry="3.2"
                fill="none"
                stroke="#FFF9EB"
                strokeWidth="1.8"
                opacity="0"
              />
              {/* 2D Liquid Impact Splash Crown Where Stream Enters Glass */}
              <path
                ref={impactCrownPathRef}
                d=""
                fill="#F9DEA9"
                opacity="0"
              />
            </g>

            {/* 3. Sculpted Heavy Curved Crystal Sham Bottom */}
            <path
              d="M 668 682 Q 746 691 824 682 L 826 704 Q 823 716 805 716 L 687 716 Q 669 716 666 704 Z"
              fill="url(#zam-glass-sham)"
            />
            <ellipse
              cx="746"
              cy="698"
              rx="68"
              ry="6.5"
              fill="#1E1007"
              fillOpacity="0.46"
            />
            <ellipse
              cx="746"
              cy="704"
              rx="62"
              ry="4.5"
              fill="#F6BE6A"
              fillOpacity="0.34"
            />
            <path
              d="M 676 711 Q 746 718 816 711"
              fill="none"
              stroke="#FFF4DC"
              strokeOpacity="0.48"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* 4. Delicate Layered Front Side Wall Reflections & Curved Rim */}
            <path
              d="M 656 526 L 672 526 L 681 680 L 668 680 Z"
              fill="url(#zam-wall-pillar-left)"
            />
            <path
              d="M 822 526 L 836 526 L 824 680 L 813 680 Z"
              fill="url(#zam-wall-pillar-right)"
            />
            <path
              d="M 663 534 L 674 672"
              stroke="#FFFFFF"
              strokeOpacity="0.46"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 829 536 L 818 672"
              stroke="#FFE3B0"
              strokeOpacity="0.32"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Front Curved Glass Rim Highlight */}
            <path
              d="M 652 520 A 94 7.5 0 0 0 840 520"
              fill="none"
              stroke="#FFF8EA"
              strokeOpacity="0.62"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* Wider, Tapered Golden-Amber Liquid Stream with Highlight Streaks */}
          <path
            ref={pourOuterPathRef}
            d=""
            fill="url(#zam-pour-grad)"
          />
          <path
            ref={pourMidHighlightRef}
            d=""
            fill="none"
            stroke="#F6C57B"
            strokeOpacity="0.58"
            strokeWidth="5.2"
            strokeLinecap="round"
          />
          <path
            ref={pourSpecStreakRef}
            d=""
            fill="none"
            stroke="#FFF9E8"
            strokeOpacity="0.82"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Natural Final Droplets */}
          <circle
            ref={dropOneRef}
            cx="760"
            cy="486"
            r="4.5"
            fill="#F3C37A"
            opacity="0"
          />
          <circle
            ref={dropTwoRef}
            cx="766"
            cy="506"
            r="3.2"
            fill="#FCE2B3"
            opacity="0"
          />

          {/* Authentic Zambara Bottle + Articulated 2D Gold Cap (100% Unclipped During Tilt!) */}
          <g ref={bottleEntranceGroupRef}>
            <g ref={bottlePivotGroupRef}>
              {/* Open Cream-Amber Glass Pouring Lip Aligned to Exact 53px Bottle Neck (x=988..1041) */}
              <g>
                <rect
                  x="990"
                  y="186"
                  width="49"
                  height="13"
                  rx="4"
                  fill="#B67C3B"
                  stroke="#F7D69C"
                  strokeOpacity="0.62"
                  strokeWidth="1.2"
                />
                <ellipse
                  cx="1014.5"
                  cy="187"
                  rx="23.5"
                  ry="3.6"
                  fill="#2C170B"
                  stroke="#FFE8BE"
                  strokeOpacity="0.65"
                  strokeWidth="1.1"
                />
              </g>

              <g clipPath="url(#zam-bottle-uncapped-clip)">
                <image
                  href="/extracted/zambara-bottle.webp"
                  x="941"
                  y="148"
                  width="148"
                  height="568"
                  preserveAspectRatio="xMidYMid meet"
                />
                <path
                  d="M 994 202 L 992 294 Q 990 328 962 360 L 960 688"
                  fill="none"
                  stroke="#FFE6BA"
                  strokeOpacity="0.22"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <rect
                  ref={bottleRimSweepRef}
                  x="910"
                  y="148"
                  width="54"
                  height="568"
                  fill="url(#zam-rim-sweep)"
                  opacity="0"
                />
              </g>

              {/* 2D Ribbed Gold Screw Cap Aligned to Exact 53px Bottle Neck */}
              <g ref={bottleCapRef}>
                <rect
                  x="988"
                  y="146"
                  width="53"
                  height="47"
                  rx="4.5"
                  fill="url(#zam-gold-cap)"
                  stroke="#5B3A0E"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                />
                {[994, 1000, 1006, 1012, 1018, 1024, 1030, 1036].map((rx) => (
                  <line
                    key={rx}
                    x1={rx}
                    y1="149"
                    x2={rx}
                    y2="181"
                    stroke="#5B3A0E"
                    strokeOpacity="0.32"
                    strokeWidth="1.1"
                  />
                ))}
                <line
                  x1="988"
                  y1="183"
                  x2="1041"
                  y2="183"
                  stroke="#4A2E09"
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                />
                <line
                  x1="991"
                  y1="148.5"
                  x2="1038"
                  y2="148.5"
                  stroke="#FFF7DA"
                  strokeOpacity="0.7"
                  strokeWidth="1.2"
                />
              </g>
            </g>
          </g>
        </g>

        {/* Scene 6: Balanced Left-Side Zambara Sun-Crest Logo & "THE SPIRIT OF AFRICA" */}
        <g ref={brandGroupRef} opacity="0">
          <image
            href="/extracted/zambara-crest-clean.webp"
            x="262"
            y="246"
            width="236"
            height="254"
            preserveAspectRatio="xMidYMid meet"
          />
          <line
            x1="342"
            y1="524"
            x2="418"
            y2="524"
            stroke="#E5B164"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <text
            x="380"
            y="562"
            textAnchor="middle"
            fill="#F5D69E"
            fontSize="21"
            fontWeight="500"
            letterSpacing="6.5"
          >
            THE SPIRIT OF AFRICA
          </text>
        </g>
      </svg>
    </div>
  );
}
