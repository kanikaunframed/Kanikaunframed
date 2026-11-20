import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Commercial2DProps } from "./Raymond2DCommercial";

interface SeedParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  floorY: number;
  bounce: number;
  drag: number;
  angle: number;
  vAngle: number;
  size: number;
  tone: number;
}

interface JuiceDroplet2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  floorY: number;
  r: number;
  stretch: number;
  tone: number;
}

/**
 * PROJECT 03 — PAPER BOAT
 * Playful, Organic & Nostalgic 2D Beverage Commercial (Refined for Compact 16:9 Window)
 * - Prominent botanical pomegranate clearly visible from frame 1, rolling naturally with deceleration.
 * - Organic, curved, asymmetric multi-layered 2D liquid splash (zero sharp spikes or mirror starbursts)
 *   revealing the ruby-seeded pomegranate interior.
 * - Individual jewel-faceted seeds with varied trajectories, varied bounce heights & multi-depth
 *   tabletop resting positions (never forming a straight horizontal row of beads).
 * - Staggered smooth slide-in & subtle settle of both original Paper Boat Swing cans framed softly by splash.
 * - Crisp final reveal of "A SIP OF NOSTALGIA".
 */
export function PaperBoat2DCommercial({
  reducedMotion,
  onComplete,
}: Commercial2DProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ambientGlowRef = useRef<SVGCircleElement | null>(null);

  const wholePomGroupRef = useRef<SVGGElement | null>(null);
  const wholePomSpinRef = useRef<SVGGElement | null>(null);
  const pomShadowRef = useRef<SVGEllipseElement | null>(null);

  const splitPomLeftRef = useRef<SVGGElement | null>(null);
  const splitPomRightRef = useRef<SVGGElement | null>(null);
  const splashBurstBackRef = useRef<SVGGElement | null>(null);
  const splashFramingCollarRef = useRef<SVGGElement | null>(null);
  const splashBurstFrontRef = useRef<SVGGElement | null>(null);

  const canPomGroupRef = useRef<SVGGElement | null>(null);
  const canGuavaGroupRef = useRef<SVGGElement | null>(null);
  const canPomShadowRef = useRef<SVGEllipseElement | null>(null);
  const canGuavaShadowRef = useRef<SVGEllipseElement | null>(null);
  const taglineRef = useRef<SVGGElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    const canvas = particleCanvasRef.current;
    const c2d = canvas ? canvas.getContext("2d") : null;
    if (canvas) {
      canvas.width = 1600;
      canvas.height = 900;
    }

    const sim = {
      active: false,
      seedAlpha: 0,
      dropletAlpha: 0,
      lastTime: 0,
    };

    // Curated individual trajectories & varied 2D perspective resting depths (y = 626..726)
    // so seeds scatter naturally in organic clusters around the cans — NEVER in a straight line!
    const seedConfigs: Array<{
      angleDeg: number;
      speed: number;
      floorY: number;
      bounce: number;
      size: number;
    }> = [
      { angleDeg: -158, speed: 460, floorY: 642, bounce: 0.52, size: 11.2 },
      { angleDeg: -146, speed: 390, floorY: 678, bounce: 0.36, size: 9.8 },
      { angleDeg: -134, speed: 520, floorY: 656, bounce: 0.58, size: 10.6 },
      { angleDeg: -124, speed: 335, floorY: 704, bounce: 0.42, size: 11.8 },
      { angleDeg: -115, speed: 445, floorY: 632, bounce: 0.31, size: 9.2 },
      { angleDeg: -164, speed: 310, floorY: 692, bounce: 0.48, size: 10.4 },
      { angleDeg: -140, speed: 270, floorY: 718, bounce: 0.38, size: 11.5 },
      { angleDeg: -106, speed: 295, floorY: 666, bounce: 0.44, size: 9.5 },
      { angleDeg: -151, speed: 545, floorY: 686, bounce: 0.55, size: 10.2 },
      { angleDeg: -129, speed: 225, floorY: 726, bounce: 0.33, size: 11.0 },
      { angleDeg: -98, speed: 250, floorY: 712, bounce: 0.4, size: 9.6 },
      { angleDeg: -82, speed: 265, floorY: 722, bounce: 0.45, size: 10.8 },
      { angleDeg: -71, speed: 310, floorY: 670, bounce: 0.35, size: 9.4 },
      { angleDeg: -62, speed: 455, floorY: 638, bounce: 0.54, size: 10.5 },
      { angleDeg: -53, speed: 350, floorY: 698, bounce: 0.41, size: 11.6 },
      { angleDeg: -44, speed: 510, floorY: 652, bounce: 0.57, size: 10.1 },
      { angleDeg: -36, speed: 395, floorY: 682, bounce: 0.37, size: 9.9 },
      { angleDeg: -25, speed: 470, floorY: 646, bounce: 0.49, size: 11.3 },
      { angleDeg: -18, speed: 320, floorY: 708, bounce: 0.43, size: 10.3 },
      { angleDeg: -48, speed: 240, floorY: 724, bounce: 0.32, size: 11.1 },
      { angleDeg: -31, speed: 555, floorY: 690, bounce: 0.52, size: 9.7 },
      { angleDeg: -66, speed: 215, floorY: 658, bounce: 0.29, size: 9.3 },
    ];

    const seeds: SeedParticle2D[] = seedConfigs.map((cfg, i) => {
      const rad = (cfg.angleDeg * Math.PI) / 180;
      const side = cfg.angleDeg < -90 ? -1 : 1;
      return {
        x: 800 + side * (8 + (i % 5) * 6),
        y: 505 + ((i % 5) - 2) * 9,
        vx: Math.cos(rad) * cfg.speed,
        vy: Math.sin(rad) * cfg.speed - 95,
        floorY: cfg.floorY,
        bounce: cfg.bounce,
        drag: 0.78 + (i % 4) * 0.045,
        angle: (i * 0.85) % (Math.PI * 2),
        vAngle: side * (3.2 + (i % 5) * 1.35),
        size: cfg.size,
        tone: i % 3,
      };
    });

    const droplets: JuiceDroplet2D[] = Array.from({ length: 30 }, (_, i) => {
      const deg = -168 + (i / 29) * 156 + ((i % 3) - 1) * 4;
      const rad = (deg * Math.PI) / 180;
      const spd = 260 + ((i * 61) % 340);
      return {
        x: 800 + ((i % 5) - 2) * 10,
        y: 498 + ((i % 3) - 1) * 8,
        vx: Math.cos(rad) * spd,
        vy: Math.sin(rad) * spd - 80,
        floorY: 635 + ((i * 23) % 92),
        r: 3.4 + (i % 4) * 1.8,
        stretch: 1.15 + (i % 3) * 0.16,
        tone: i % 3,
      };
    });

    const render2DCanvas = (timeSec: number) => {
      if (!c2d || !canvas) return;
      c2d.clearRect(0, 0, 1600, 900);
      if (!sim.active) return;

      const dt = Math.min(Math.max(timeSec - sim.lastTime, 0), 0.045);
      sim.lastTime = timeSec;
      const gravity = 920;

      // 1. Organic curved liquid droplets
      if (sim.dropletAlpha > 0.01) {
        c2d.save();
        c2d.globalAlpha = sim.dropletAlpha;
        for (let i = 0; i < droplets.length; i++) {
          const d = droplets[i];
          d.vy += gravity * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.y > d.floorY) {
            d.y = d.floorY;
            d.vy *= -0.18;
            d.vx *= 0.72;
          }
          const moveAng = Math.atan2(d.vy, d.vx);
          c2d.save();
          c2d.translate(d.x, d.y);
          c2d.rotate(moveAng);
          c2d.fillStyle =
            d.tone === 0 ? "#C9142E" : d.tone === 1 ? "#E6334E" : "#F2667B";
          c2d.beginPath();
          c2d.ellipse(0, 0, d.r * d.stretch, d.r * 0.82, 0, 0, Math.PI * 2);
          c2d.fill();
          c2d.restore();
        }
        c2d.restore();
      }

      // 2. Individual faceted pomegranate aril seeds at varied 2D depths & bounce heights
      if (sim.seedAlpha > 0.01) {
        c2d.save();
        c2d.globalAlpha = sim.seedAlpha;
        for (let i = 0; i < seeds.length; i++) {
          const s = seeds[i];
          s.vy += gravity * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.angle += s.vAngle * dt;

          // Keep seeds well inside the compact window's rounded horizontal safe zone
          if (s.x < 195) {
            s.x = 195;
            s.vx = Math.abs(s.vx) * 0.45;
          } else if (s.x > 1405) {
            s.x = 1405;
            s.vx = -Math.abs(s.vx) * 0.45;
          }

          if (s.y > s.floorY) {
            s.y = s.floorY;
            if (Math.abs(s.vy) > 42) {
              s.vy = -s.vy * s.bounce;
              s.vx *= s.drag;
              s.vAngle *= 0.78;
            } else {
              s.vy = 0;
              s.vx *= 0.84;
              s.vAngle *= 0.75;
            }
          }

          // Gently nudge resting seeds out from directly underneath the two can bases (x=590..1010, y=645..685)
          if (
            Math.abs(s.vy) < 25 &&
            s.x > 610 &&
            s.x < 990 &&
            s.floorY > 642 &&
            s.floorY < 695
          ) {
            s.vx += s.x < 800 ? -110 * dt : 110 * dt;
          }

          // Individual soft grounded shadow at each seed's own depth plane
          const heightAboveFloor = Math.max(0, s.floorY - s.y);
          if (heightAboveFloor < 110) {
            const shAlpha = 0.24 * (1 - heightAboveFloor / 110);
            c2d.fillStyle = `rgba(88, 45, 28, ${shAlpha.toFixed(3)})`;
            c2d.beginPath();
            c2d.ellipse(
              s.x,
              s.floorY + s.size * 0.46,
              s.size * 0.95,
              3.2,
              0,
              0,
              Math.PI * 2
            );
            c2d.fill();
          }

          c2d.save();
          c2d.translate(s.x, s.y);
          c2d.rotate(s.angle);

          // Organic teardrop-gem pomegranate aril shape (not a bead circle!)
          const r = s.size;
          c2d.fillStyle =
            s.tone === 0 ? "#B30C26" : s.tone === 1 ? "#CF1734" : "#96071D";
          c2d.beginPath();
          c2d.moveTo(-r * 1.05, 0);
          c2d.bezierCurveTo(
            -r * 0.65,
            -r * 0.82,
            r * 0.55,
            -r * 0.78,
            r * 0.98,
            -r * 0.08
          );
          c2d.bezierCurveTo(
            r * 0.68,
            r * 0.76,
            -r * 0.58,
            r * 0.82,
            -r * 1.05,
            0
          );
          c2d.closePath();
          c2d.fill();

          // Soft blush inner kernel
          c2d.fillStyle = "rgba(255, 206, 214, 0.44)";
          c2d.beginPath();
          c2d.ellipse(-r * 0.08, r * 0.04, r * 0.44, r * 0.23, 0.1, 0, Math.PI * 2);
          c2d.fill();

          // Wet ruby highlight
          c2d.fillStyle = "rgba(255, 255, 255, 0.84)";
          c2d.beginPath();
          c2d.ellipse(
            -r * 0.26,
            -r * 0.26,
            r * 0.28,
            r * 0.13,
            -0.28,
            0,
            Math.PI * 2
          );
          c2d.fill();

          c2d.restore();
        }
        c2d.restore();
      }
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: function () {
          render2DCanvas(this.time());
        },
        onComplete: finish,
      });

      if (reducedMotion) {
        gsap.set([wholePomGroupRef.current, pomShadowRef.current], { opacity: 0 });
        gsap.set([splitPomLeftRef.current, splitPomRightRef.current], { opacity: 0 });
        gsap.set([splashBurstBackRef.current, splashBurstFrontRef.current], { opacity: 0 });
        gsap.set(splashFramingCollarRef.current, { scale: 0.92, opacity: 0.85, svgOrigin: "800 500" });
        gsap.set(canPomGroupRef.current, { x: 568, y: 148, rotation: 9, opacity: 1 });
        gsap.set(canGuavaGroupRef.current, { x: 816, y: 148, rotation: 9.5, opacity: 1 });
        gsap.set(canPomShadowRef.current, { attr: { cx: 678 }, opacity: 0.34 });
        gsap.set(canGuavaShadowRef.current, { attr: { cx: 926 }, opacity: 0.34 });
        tl.fromTo(
          taglineRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          0.9
        ).to({}, { duration: 1.2 }, 1.8);
        return;
      }

      // Initial state: Pomegranate is prominently visible right inside the left-middle safe zone!
      gsap.set(ambientGlowRef.current, {
        scale: 0.88,
        opacity: 0.55,
        svgOrigin: "800 440",
      });
      gsap.set(wholePomGroupRef.current, {
        x: 330,
        y: 538,
        scale: 1,
        opacity: 1,
      });
      gsap.set(wholePomSpinRef.current, { rotation: -28, svgOrigin: "0 0" });
      gsap.set(pomShadowRef.current, {
        attr: { cx: 330, rx: 92 },
        opacity: 0.38,
      });

      gsap.set(splitPomLeftRef.current, {
        x: 800,
        y: 520,
        rotation: 0,
        scale: 0.92,
        opacity: 0,
        svgOrigin: "0 0",
      });
      gsap.set(splitPomRightRef.current, {
        x: 800,
        y: 520,
        rotation: 0,
        scale: 0.92,
        opacity: 0,
        svgOrigin: "0 0",
      });

      gsap.set(splashBurstBackRef.current, {
        scale: 0.16,
        rotation: -6,
        opacity: 0,
        svgOrigin: "800 505",
      });
      gsap.set(splashFramingCollarRef.current, {
        scale: 0.18,
        opacity: 0,
        svgOrigin: "800 515",
      });
      gsap.set(splashBurstFrontRef.current, {
        scale: 0.16,
        rotation: 5,
        opacity: 0,
        svgOrigin: "800 510",
      });

      // Both cans enter smoothly from inside the compact window's safe sides
      gsap.set(canPomGroupRef.current, {
        x: 310,
        y: 176,
        rotation: 2,
        opacity: 0,
        svgOrigin: "108 460",
      });
      gsap.set(canGuavaGroupRef.current, {
        x: 1070,
        y: 176,
        rotation: 17,
        opacity: 0,
        svgOrigin: "108 460",
      });
      gsap.set(canPomShadowRef.current, { attr: { cx: 430 }, opacity: 0 });
      gsap.set(canGuavaShadowRef.current, { attr: { cx: 1190 }, opacity: 0 });
      gsap.set(taglineRef.current, { opacity: 0, y: 14 });

      // SCENE 1 & 2 (0.0s - 1.85s): Prominent botanical pomegranate rolls smoothly in & decelerates
      tl.to(
        ambientGlowRef.current,
        {
          scale: 1.05,
          opacity: 0.95,
          duration: 1.2,
          ease: "power2.out",
        },
        0
      )
        .to(
          wholePomGroupRef.current,
          {
            x: 800,
            duration: 1.72,
            ease: "power3.out",
          },
          0.12
        )
        .to(
          wholePomSpinRef.current,
          {
            rotation: 368,
            duration: 1.72,
            ease: "power3.out",
          },
          0.12
        )
        .to(
          pomShadowRef.current,
          {
            attr: { cx: 800, rx: 98 },
            opacity: 0.44,
            duration: 1.72,
            ease: "power3.out",
          },
          0.12
        );

      // SCENE 3 (1.82s - 3.65s): Pomegranate splits revealing interior + organic curved 2D splash & multi-depth seeds
      tl.to(
        wholePomGroupRef.current,
        {
          scaleX: 1.09,
          scaleY: 0.94,
          y: 526,
          duration: 0.16,
          ease: "power2.inOut",
        },
        1.82
      )
        .set([wholePomGroupRef.current, pomShadowRef.current], { opacity: 0 }, 1.98)
        .call(
          () => {
            sim.active = true;
            sim.lastTime = 1.98;
            sim.seedAlpha = 1;
            sim.dropletAlpha = 0.96;
          },
          [],
          1.98
        )
        // Reveal ruby-aril botanical interior halves opening organically
        .set([splitPomLeftRef.current, splitPomRightRef.current], { opacity: 1 }, 1.98)
        .to(
          splitPomLeftRef.current,
          {
            x: 545,
            y: 562,
            rotation: -32,
            scale: 0.98,
            duration: 0.58,
            ease: "power3.out",
          },
          1.98
        )
        .to(
          splitPomRightRef.current,
          {
            x: 1055,
            y: 556,
            rotation: 28,
            scale: 0.98,
            duration: 0.58,
            ease: "power3.out",
          },
          1.98
        )
        .to(
          [splitPomLeftRef.current, splitPomRightRef.current],
          {
            y: 590,
            opacity: 0,
            duration: 0.48,
            ease: "power2.in",
          },
          2.52
        )
        // Organic curved fluid splash expands naturally
        .to(
          splashBurstBackRef.current,
          {
            scale: 1.04,
            rotation: 0,
            opacity: 0.94,
            duration: 0.48,
            ease: "power3.out",
          },
          1.98
        )
        .to(
          splashFramingCollarRef.current,
          {
            scale: 1.02,
            opacity: 0.92,
            duration: 0.54,
            ease: "power3.out",
          },
          2.0
        )
        .to(
          splashBurstFrontRef.current,
          {
            scale: 1.0,
            rotation: 0,
            opacity: 0.95,
            duration: 0.5,
            ease: "power3.out",
          },
          2.02
        )
        // Outer burst ribbons disperse while the soft organic splash collar settles gently behind the cans!
        .to(
          [splashBurstBackRef.current, splashBurstFrontRef.current],
          {
            scale: 1.18,
            y: 26,
            opacity: 0,
            duration: 0.95,
            ease: "power2.inOut",
          },
          2.52
        )
        .to(
          splashFramingCollarRef.current,
          {
            scale: 0.9,
            y: 12,
            opacity: 0.78,
            duration: 1.25,
            ease: "power2.inOut",
          },
          2.55
        )
        .to(
          sim,
          {
            dropletAlpha: 0,
            duration: 1.15,
            ease: "power2.out",
          },
          2.75
        );

      // SCENE 4 (2.68s - 4.95s): First original Paper Boat can slides in; second follows with timing delay
      tl.to(
        canPomGroupRef.current,
        {
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
        },
        2.68
      )
        .to(
          canPomGroupRef.current,
          {
            x: 568,
            y: 148,
            rotation: 9, // Aligns can label upright
            duration: 1.32,
            ease: "power3.out",
          },
          2.68
        )
        .to(
          canPomShadowRef.current,
          {
            attr: { cx: 678 },
            opacity: 0.34,
            duration: 1.32,
            ease: "power3.out",
          },
          2.68
        )
        // Second can (Guava) follows with deliberate 0.28s delay & gentle rotational settle
        .to(
          canGuavaGroupRef.current,
          {
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          },
          2.96
        )
        .to(
          canGuavaGroupRef.current,
          {
            x: 816,
            y: 148,
            rotation: 9.5,
            duration: 1.35,
            ease: "power3.out",
          },
          2.96
        )
        .to(
          canGuavaShadowRef.current,
          {
            attr: { cx: 926 },
            opacity: 0.34,
            duration: 1.35,
            ease: "power3.out",
          },
          2.96
        )
        // Subtle settled micro-cushion on both cans
        .to(
          [canPomGroupRef.current, canGuavaGroupRef.current],
          {
            y: 142,
            duration: 0.85,
            ease: "sine.inOut",
          },
          4.35
        );

      // SCENE 5 (4.75s - 6.45s): Crisp reveal of "A SIP OF NOSTALGIA" inside bottom safe area
      tl.to(
        taglineRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
        },
        4.78
      ).to({}, { duration: 1.55 }, 4.78);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#F6EDE0] select-none"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          <radialGradient id="pb-studio-bg" cx="50%" cy="44%" r="68%">
            <stop offset="0%" stopColor="#FDF8F0" />
            <stop offset="58%" stopColor="#F5EAD9" />
            <stop offset="100%" stopColor="#E6D5BD" />
          </radialGradient>

          <radialGradient id="pb-warm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#FCECD4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F5EAD9" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="pb-pom-skin" cx="34%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#F65369" />
            <stop offset="46%" stopColor="#CC1630" />
            <stop offset="85%" stopColor="#94091D" />
            <stop offset="100%" stopColor="#6D0413" />
          </radialGradient>

          <linearGradient id="pb-juice-deep" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#DF1A37" />
            <stop offset="100%" stopColor="#9A081E" />
          </linearGradient>

          <linearGradient id="pb-juice-ruby" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C4102A" />
            <stop offset="55%" stopColor="#EB334F" />
            <stop offset="100%" stopColor="#FA788D" />
          </linearGradient>

          <linearGradient id="pb-juice-coral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F77B8E" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#D61E3A" stopOpacity="0.82" />
          </linearGradient>

          <filter id="pb-shadow-blur" x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>

        {/* Warm Beige 2D Studio Interior */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#pb-studio-bg)" />
        <circle
          ref={ambientGlowRef}
          cx="800"
          cy="440"
          r="430"
          fill="url(#pb-warm-glow)"
        />

        {/* Soft Studio Tabletop Plane (y = 635..900) */}
        <rect x="0" y="636" width="1600" height="264" fill="#EADBC6" opacity="0.58" />
        <line
          x1="120"
          y1="636"
          x2="1480"
          y2="636"
          stroke="#D7C3A7"
          strokeWidth="1.2"
          strokeOpacity="0.55"
        />

        {/* Soft Asymmetric Organic Framing Splash Collar (Remains Subtly Framing Both Cans in Final Scene) */}
        <g ref={splashFramingCollarRef}>
          {/* Deep Ruby Sweeping S-Curve Back Splash Wave */}
          <path
            d="M 632 536 C 548 548, 468 532, 438 492 C 418 466, 444 442, 478 456 C 522 474, 574 492, 628 492 C 562 452, 492 396, 474 344 C 462 312, 496 296, 524 324 C 562 362, 608 422, 662 464 Z"
            fill="url(#pb-juice-ruby)"
            opacity="0.72"
          />
          {/* Left Secondary Coral Liquid Ribbon */}
          <path
            d="M 618 552 C 566 574, 504 592, 476 576 C 458 566, 470 544, 498 546 C 538 548, 578 542, 624 532 Z"
            fill="url(#pb-juice-coral)"
            opacity="0.82"
          />
          {/* Right Asymmetric Sweeping Ruby Crest & Lower Curl */}
          <path
            d="M 954 478 C 1022 436, 1094 368, 1142 336 C 1172 316, 1196 344, 1168 374 C 1132 414, 1068 458, 1006 492 C 1072 486, 1142 500, 1172 532 C 1192 554, 1166 578, 1132 564 C 1082 544, 1018 532, 948 534 Z"
            fill="url(#pb-juice-coral)"
            opacity="0.84"
          />
          <path
            d="M 976 446 C 1018 402, 1054 348, 1046 314 C 1040 292, 1014 298, 1014 324 C 1014 358, 992 404, 956 442 Z"
            fill="url(#pb-juice-ruby)"
            opacity="0.68"
          />
          {/* Organic Asymmetric Splash Droplets & Teardrop Pearls */}
          <ellipse cx="452" cy="296" rx="11" ry="8.5" transform="rotate(-28 452 296)" fill="#E62D49" opacity="0.8" />
          <circle cx="412" cy="456" r="7" fill="#FA758A" opacity="0.78" />
          <circle cx="450" cy="592" r="5.5" fill="#C9142E" opacity="0.72" />
          <ellipse cx="1204" cy="316" rx="12" ry="9" transform="rotate(24 1204 316)" fill="#EB3853" opacity="0.8" />
          <circle cx="1062" cy="278" r="6.5" fill="#F76E84" opacity="0.74" />
          <circle cx="1202" cy="558" r="7.5" fill="#D41B37" opacity="0.74" />
        </g>

        {/* Expanding Asymmetric Fluid Splash Wave (Scene 3 Burst) */}
        <g ref={splashBurstBackRef}>
          {/* Upper-Left Flowing Curved Liquid Crest */}
          <path
            d="M 822 504 C 736 418, 602 292, 505 268 C 468 258, 456 298, 494 318 C 562 354, 654 432, 728 508 C 618 478, 474 494, 398 548 C 368 570, 392 606, 436 592 C 524 562, 676 544, 824 542 Z"
            fill="url(#pb-juice-deep)"
          />
          {/* Upper-Right Curved Bulbous Liquid Wave */}
          <path
            d="M 778 502 C 864 396, 976 264, 1078 242 C 1118 234, 1134 276, 1094 298 C 1022 338, 938 422, 868 504 C 976 468, 1118 478, 1198 534 C 1228 554, 1206 592, 1162 578 C 1072 548, 924 538, 776 540 Z"
            fill="url(#pb-juice-ruby)"
          />
          {/* Central Top Rounded Crown Lobes */}
          <path
            d="M 744 514 C 734 402, 712 288, 736 236 C 752 204, 788 214, 786 254 C 784 308, 792 396, 804 484 C 824 398, 858 308, 888 268 C 910 238, 942 262, 920 298 C 888 352, 854 430, 846 516 Z"
            fill="url(#pb-juice-coral)"
          />
          <circle cx="448" cy="252" r="14" fill="#DF1A37" />
          <circle cx="758" cy="186" r="10" fill="#FA7287" />
          <circle cx="1144" cy="228" r="15" fill="#E62B47" />
        </g>

        {/* Grounded Shadows */}
        <ellipse
          ref={pomShadowRef}
          cx="330"
          cy="648"
          rx="92"
          ry="16"
          fill="#6B4B30"
          opacity="0.38"
          filter="url(#pb-shadow-blur)"
        />
        <ellipse
          ref={canPomShadowRef}
          cx="678"
          cy="656"
          rx="86"
          ry="15"
          fill="#5C4028"
          opacity="0"
          filter="url(#pb-shadow-blur)"
        />
        <ellipse
          ref={canGuavaShadowRef}
          cx="926"
          cy="656"
          rx="86"
          ry="15"
          fill="#5C4028"
          opacity="0"
          filter="url(#pb-shadow-blur)"
        />

        {/* Scene 2: Prominent Botanical Pomegranate (Radius 108) */}
        <g ref={wholePomGroupRef}>
          <g ref={wholePomSpinRef}>
            {/* Sculpted Botanical Calyx Crown */}
            <path
              d="M -26 -96 C -32 -116, -42 -134, -36 -140 C -26 -136, -16 -120, -11 -116 C -6 -128, -2 -146, 2 -146 C 7 -146, 10 -126, 15 -116 C 22 -124, 34 -138, 40 -134 C 42 -126, 32 -108, 26 -96 Z"
              fill="#9E0D22"
            />
            <ellipse cx="0" cy="-98" rx="18" ry="6" fill="#6D0514" />

            {/* Rich Botanical Fruit Body with Subtle Organic Lobes */}
            <path
              d="M 0 -106 C 62 -106, 110 -58, 108 4 C 106 64, 58 108, 0 108 C -60 108, -108 62, -108 2 C -108 -58, -60 -106, 0 -106 Z"
              fill="url(#pb-pom-skin)"
            />

            {/* Curved Botanical Specular Highlights & Dimple Texture */}
            <path
              d="M -68 -52 A 82 82 0 0 1 22 -82"
              fill="none"
              stroke="#FFA3B0"
              strokeOpacity="0.54"
              strokeWidth="7.5"
              strokeLinecap="round"
            />
            <circle cx="-42" cy="-34" r="9.5" fill="#FFC0C9" opacity="0.46" />
            <circle cx="48" cy="36" r="4" fill="#640412" opacity="0.28" />
            <circle cx="34" cy="54" r="3" fill="#640412" opacity="0.25" />
            <circle cx="-36" cy="48" r="3.5" fill="#640412" opacity="0.24" />
          </g>
        </g>

        {/* Scene 3: Detailed Botanical Pomegranate Interior Halves */}
        <g ref={splitPomLeftRef} opacity="0">
          <path d="M 4 -102 A 102 102 0 0 0 4 102 C -12 68, -8 -68, 4 -102 Z" fill="#AE0E25" />
          <path d="M -2 -90 A 88 90 0 0 0 -2 90 C -10 56, -8 -56, -2 -90 Z" fill="#FCF2E1" />
          {/* Two Ruby Aril Seed Chambers */}
          <path d="M -14 -72 C -54 -68, -74 -36, -68 -8 C -52 -4, -24 -8, -14 -14 Z" fill="#C4112B" />
          <path d="M -14 10 C -52 14, -72 42, -62 68 C -44 74, -20 62, -14 54 Z" fill="#AD0B22" />
          {[
            [-36, -46],
            [-50, -32],
            [-28, -26],
            [-46, -18],
            [-34, 28],
            [-50, 42],
            [-30, 48],
          ].map(([ax, ay], idx) => (
            <ellipse
              key={idx}
              cx={ax}
              cy={ay}
              rx="7.5"
              ry="5.5"
              fill="#EB334F"
            />
          ))}
        </g>

        <g ref={splitPomRightRef} opacity="0">
          <path d="M -4 -102 A 102 102 0 0 1 -4 102 C 12 68, 8 -68, -4 -102 Z" fill="#AE0E25" />
          <path d="M 2 -90 A 88 90 0 0 1 2 90 C 10 56, 8 -56, 2 -90 Z" fill="#FCF2E1" />
          <path d="M 14 -72 C 54 -68, 74 -36, 68 -8 C 52 -4, 24 -8, 14 -14 Z" fill="#C4112B" />
          <path d="M 14 10 C 52 14, 72 42, 62 68 C 44 74, 20 62, 14 54 Z" fill="#AD0B22" />
          {[
            [36, -46],
            [50, -32],
            [28, -26],
            [46, -18],
            [34, 28],
            [50, 42],
            [30, 48],
          ].map(([ax, ay], idx) => (
            <ellipse
              key={idx}
              cx={ax}
              cy={ay}
              rx="7.5"
              ry="5.5"
              fill="#EB334F"
            />
          ))}
        </g>

        {/* Scene 4: Authentic Original Paper Boat Swing Cans (Pomegranate & Guava) */}
        <g ref={canPomGroupRef}>
          <image
            href="/extracted/paperboat-can-pomegranate.webp"
            x="0"
            y="0"
            width="216"
            height="498"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
        <g ref={canGuavaGroupRef}>
          <image
            href="/extracted/paperboat-can-guava.webp"
            x="0"
            y="0"
            width="216"
            height="498"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Foreground Curved Liquid Splash Ribbons (Scene 3 Burst) */}
        <g ref={splashBurstFrontRef}>
          <path
            d="M 832 518 C 724 462, 592 456, 512 504 C 488 518, 508 548, 542 536 C 618 510, 728 524, 830 554 Z"
            fill="url(#pb-juice-ruby)"
          />
          <path
            d="M 768 518 C 876 458, 1012 452, 1092 502 C 1116 516, 1096 548, 1062 536 C 984 508, 872 522, 770 554 Z"
            fill="url(#pb-juice-coral)"
          />
        </g>

        {/* Scene 5: Final Tagline ("A SIP OF NOSTALGIA") Inside Safe Area */}
        <g ref={taglineRef} opacity="0">
          <line
            x1="772"
            y1="772"
            x2="828"
            y2="772"
            stroke="#C8162E"
            strokeOpacity="0.48"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text
            x="800"
            y="814"
            textAnchor="middle"
            fill="#1A2744"
            fontSize="26"
            fontWeight="600"
            letterSpacing="7.5"
          >
            A SIP OF NOSTALGIA
          </text>
        </g>
      </svg>

      {/* Synced 16:9 2D Particle Canvas for Multi-Depth Faceted Pomegranate Seeds & Droplets */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}
