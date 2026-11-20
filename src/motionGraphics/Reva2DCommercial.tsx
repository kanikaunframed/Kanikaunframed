import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { Commercial2DProps } from "./Raymond2DCommercial";

/**
 * PROJECT 05 — REVA
 * Minimal, Tactile Sage-Green 2D Fabric Patch Commercial (Refined for Compact 16:9 Window)
 * - Replaces regular digital grid with natural organic 2D woven textile details:
 *   fractal spun-cotton grain, irregular curved fibre slubs, embossed diagonal perimeter
 *   crimp band & delicate edge stitching.
 * - Smooth area light sweep gradually revealing the natural fabric surface.
 * - Mask reveal of the authentic REVA logo with subtle 2D embroidered/debossed highlights & shadows.
 * - Displays the exact tagline "WHEN UR IDEAS NEED A RESET." once cleanly below the patch (no duplication).
 */
export function Reva2DCommercial({
  reducedMotion,
  onComplete,
}: Commercial2DProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cameraGroupRef = useRef<SVGGElement | null>(null);
  const patchGroupRef = useRef<SVGGElement | null>(null);
  const patchShadowRef = useRef<SVGRectElement | null>(null);
  const fabricDetailGroupRef = useRef<SVGGElement | null>(null);
  const stitchBorderRef = useRef<SVGRectElement | null>(null);
  const lightSweepRef = useRef<SVGRectElement | null>(null);
  const logoMaskRectRef = useRef<SVGRectElement | null>(null);
  const logoEmbossGroupRef = useRef<SVGGElement | null>(null);
  const debossShadowRef = useRef<SVGImageElement | null>(null);
  const embossHighlightRef = useRef<SVGImageElement | null>(null);
  const taglineGroupRef = useRef<SVGGElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current();
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: finish,
      });

      if (reducedMotion) {
        gsap.set(patchGroupRef.current, {
          opacity: 1,
          scale: 1,
          svgOrigin: "800 392",
        });
        gsap.set(patchShadowRef.current, { opacity: 0.22 });
        gsap.set(fabricDetailGroupRef.current, { opacity: 0.72 });
        gsap.set(logoEmbossGroupRef.current, { opacity: 1 });
        gsap.set(logoMaskRectRef.current, { attr: { x: 580, width: 450 } });
        tl.fromTo(
          taglineGroupRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.75, ease: "power2.out" },
          0.9
        ).to({}, { duration: 1.2 }, 1.8);
        return;
      }

      // Initial state inside 1600x900 compact 16:9 safe zone:
      // Patch spans x = 606..994, y = 198..586 (388x388, rx = 68), tagline at y = 736.
      gsap.set(cameraGroupRef.current, {
        scale: 0.96,
        y: 12,
        svgOrigin: "800 392",
      });
      gsap.set(patchGroupRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 12,
        svgOrigin: "800 392",
      });
      gsap.set(patchShadowRef.current, {
        opacity: 0,
        scale: 0.93,
        svgOrigin: "806 404",
      });
      gsap.set(fabricDetailGroupRef.current, { opacity: 0.38 });
      gsap.set(stitchBorderRef.current, { strokeOpacity: 0.28 });
      gsap.set(lightSweepRef.current, { attr: { x: 280 }, opacity: 0 });
      gsap.set(logoEmbossGroupRef.current, { opacity: 0 });
      gsap.set(logoMaskRectRef.current, { attr: { x: 580, width: 0 } });
      gsap.set(debossShadowRef.current, { opacity: 0 });
      gsap.set(embossHighlightRef.current, { opacity: 0 });
      gsap.set(taglineGroupRef.current, { opacity: 0, y: 14 });

      // SCENE 1 (0.0s - 1.15s): Calm warm-beige studio + sage-green REVA patch settles softly
      tl.to(
        patchGroupRef.current,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.1,
          ease: "power3.out",
        },
        0.08
      ).to(
        patchShadowRef.current,
        {
          opacity: 0.22,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
        },
        0.08
      );

      // SCENE 2 (1.0s - 2.6s): Gentle close-up zoom revealing natural spun-cotton grain & delicate stitching
      tl.to(
        cameraGroupRef.current,
        {
          scale: 1.38,
          y: 24,
          duration: 1.6,
          ease: "power2.inOut",
        },
        1.0
      )
        .to(
          fabricDetailGroupRef.current,
          {
            opacity: 0.92,
            duration: 1.45,
            ease: "sine.inOut",
          },
          1.1
        )
        .to(
          stitchBorderRef.current,
          {
            strokeOpacity: 0.52,
            duration: 1.25,
            ease: "sine.out",
          },
          1.2
        );

      // SCENE 3 (2.25s - 3.85s): Soft broad area of warm light moves gradually across fabric surface
      tl.to(
        lightSweepRef.current,
        {
          opacity: 0.95,
          duration: 0.42,
          ease: "sine.in",
        },
        2.25
      )
        .to(
          lightSweepRef.current,
          {
            attr: { x: 1120 },
            duration: 1.65,
            ease: "power2.inOut",
          },
          2.25
        )
        .to(
          lightSweepRef.current,
          {
            opacity: 0,
            duration: 0.45,
            ease: "sine.out",
          },
          3.48
        );

      // SCENE 4 (2.9s - 4.35s): Authentic REVA logo revealed through smooth mask with 2D embossed depth
      tl.to(
        logoEmbossGroupRef.current,
        {
          opacity: 1,
          duration: 0.45,
          ease: "sine.out",
        },
        2.88
      )
        .to(
          logoMaskRectRef.current,
          {
            attr: { width: 450 },
            duration: 1.28,
            ease: "power2.inOut",
          },
          2.92
        )
        .to(
          [debossShadowRef.current, embossHighlightRef.current],
          {
            opacity: 0.54,
            duration: 0.95,
            ease: "power2.out",
          },
          3.08
        );

      // SCENE 5 (4.25s - 5.45s): Smooth zoom-out framing complete minimal REVA patch inside safe zone
      tl.to(
        cameraGroupRef.current,
        {
          scale: 1,
          y: 0,
          duration: 1.22,
          ease: "power2.inOut",
        },
        4.25
      ).to(
        fabricDetailGroupRef.current,
        {
          opacity: 0.68,
          duration: 1.1,
          ease: "sine.out",
        },
        4.3
      );

      // SCENE 6 (5.0s - 6.3s): Single crisp reveal of "WHEN UR IDEAS NEED A RESET."
      tl.to(
        taglineGroupRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
        },
        5.0
      ).to({}, { duration: 1.3 }, 5.0);
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#EFEAE0] select-none"
    >
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          {/* Soft Beige Editorial Studio Surface */}
          <radialGradient id="reva-studio-bg" cx="50%" cy="46%" r="68%">
            <stop offset="0%" stopColor="#F8F5EE" />
            <stop offset="58%" stopColor="#EFEAE0" />
            <stop offset="100%" stopColor="#E1DACB" />
          </radialGradient>

          {/* Natural Sage-Green Matte Textile Gradient with Subtle Surface Variation */}
          <radialGradient id="reva-sage-variation" cx="38%" cy="34%" r="74%">
            <stop offset="0%" stopColor="#A5AD98" />
            <stop offset="54%" stopColor="#959D88" />
            <stop offset="100%" stopColor="#838B76" />
          </radialGradient>

          {/* Fine Diagonal Textile Twill-Crimp Pattern for the Heat-Sealed Perimeter Band Only */}
          <pattern
            id="reva-edge-crimp"
            width="9"
            height="9"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(34)"
          >
            <line
              x1="0"
              y1="2"
              x2="9"
              y2="2"
              stroke="#6E7662"
              strokeOpacity="0.22"
              strokeWidth="1.2"
            />
            <line
              x1="0"
              y1="3.4"
              x2="9"
              y2="3.4"
              stroke="#DCE1D2"
              strokeOpacity="0.18"
              strokeWidth="0.9"
            />
          </pattern>

          {/* Seamless Fine Diagonal Twill Micro-Weave Across Fabric Cushion (Continuous Lines — Zero Tile Seams!) */}
          <pattern
            id="reva-fine-twill"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(27)"
          >
            <line
              x1="0"
              y1="1.5"
              x2="6"
              y2="1.5"
              stroke="#F4F6EE"
              strokeOpacity="0.08"
              strokeWidth="0.7"
            />
            <line
              x1="0"
              y1="4.5"
              x2="6"
              y2="4.5"
              stroke="#68705C"
              strokeOpacity="0.065"
              strokeWidth="0.65"
            />
          </pattern>

          {/* Organic Fractal Spun-Cotton Fabric Grain Filter (Zero Digital Grid!) */}
          <filter id="reva-cotton-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.62 0.68"
              numOctaves="4"
              seed="14"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.95
                      0 0 0 0 0.96
                      0 0 0 0 0.92
                      0 0 0 0.13 0"
              result="warmGrain"
            />
            <feComposite in="warmGrain" in2="SourceGraphic" operator="in" />
          </filter>

          {/* Broad Soft Area of Light Sweeping Across Sage Fabric */}
          <linearGradient id="reva-raking-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFCF5" stopOpacity="0" />
            <stop offset="30%" stopColor="#FFFCF5" stopOpacity="0.09" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#FFFCF5" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#FFFCF5" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="reva-mask-feather" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="86%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <mask id="reva-logo-reveal-mask">
            <rect
              ref={logoMaskRectRef}
              x="580"
              y="260"
              width="450"
              height="270"
              fill="url(#reva-mask-feather)"
            />
          </mask>

          {/* Perimeter Crimp Band Mask (Outer 24px Rim of Patch Only) */}
          <mask id="reva-perimeter-band-mask">
            <rect x="606" y="198" width="388" height="388" rx="68" fill="#FFFFFF" />
            <rect x="630" y="222" width="340" height="340" rx="48" fill="#000000" />
          </mask>

          <clipPath id="reva-patch-clip">
            <rect x="606" y="198" width="388" height="388" rx="68" />
          </clipPath>

          <filter id="reva-emboss-light" x="0%" y="0%" width="100%" height="100%">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.96
                      0 0 0 0 0.97
                      0 0 0 0 0.93
                      0 0 0 1 0"
            />
          </filter>
          <filter id="reva-deboss-dark" x="0%" y="0%" width="100%" height="100%">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.22
                      0 0 0 0 0.25
                      0 0 0 0 0.19
                      0 0 0 1 0"
            />
          </filter>

          <filter id="reva-patch-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        {/* Soft Warm-Beige Interior Backdrop */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#reva-studio-bg)" />

        <g ref={cameraGroupRef}>
          {/* Soft Layered 2D Contact Shadow */}
          <rect
            ref={patchShadowRef}
            x="614"
            y="212"
            width="388"
            height="388"
            rx="70"
            fill="#4A463B"
            opacity="0.22"
            filter="url(#reva-patch-shadow)"
          />

          {/* Tactile Sage-Green 2D REVA Fabric Patch */}
          <g ref={patchGroupRef}>
            {/* Subtle Off-White Release-Liner Backing Edge */}
            <rect
              x="602"
              y="194"
              width="396"
              height="396"
              rx="71"
              fill="#FBF9F3"
              stroke="#DCD5C6"
              strokeWidth="1.2"
            />

            {/* Sage-Green Matte Textile Base */}
            <rect
              x="606"
              y="198"
              width="388"
              height="388"
              rx="68"
              fill="url(#reva-sage-variation)"
            />

            <g clipPath="url(#reva-patch-clip)">
              {/* Natural Woven Textile Grain, Seamless Fine Twill, Irregular Cotton Fibres & Perimeter Crimp */}
              <g ref={fabricDetailGroupRef}>
                {/* Organic Fractal Spun-Cotton Grain */}
                <rect
                  x="606"
                  y="198"
                  width="388"
                  height="388"
                  fill="#FFFFFF"
                  filter="url(#reva-cotton-grain)"
                />
                {/* Seamless Fine Diagonal Twill Micro-Weave */}
                <rect
                  x="606"
                  y="198"
                  width="388"
                  height="388"
                  fill="url(#reva-fine-twill)"
                />
                {/* Full-Patch Non-Repeating Irregular Curved Cotton Fibre Slubs (Zero Tile Seams) */}
                <path
                  d="M 642 246 Q 686 242 728 248 M 784 238 Q 838 243 886 237 M 912 264 Q 948 261 974 266 M 636 298 Q 692 303 744 296 M 818 312 Q 876 307 936 314 M 658 352 Q 710 347 764 353 M 846 362 Q 904 367 958 360 M 632 418 Q 688 423 742 417 M 812 434 Q 874 429 938 436 M 654 484 Q 716 479 778 486 M 836 496 Q 896 501 952 494 M 668 538 Q 732 543 794 537 M 844 544 Q 902 539 948 545"
                  fill="none"
                  stroke="#F4F6EE"
                  strokeOpacity="0.15"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                />
                <path
                  d="M 652 272 Q 704 276 758 270 M 808 282 Q 864 278 922 284 M 644 384 Q 702 389 756 383 M 828 396 Q 886 391 946 398 M 648 456 Q 706 461 762 455 M 822 466 Q 882 461 942 468 M 684 514 Q 744 518 806 512"
                  fill="none"
                  stroke="#636B57"
                  strokeOpacity="0.11"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                {/* Tactile Diagonal-Embossed Perimeter Seal Band (Matching Original REVA Patch) */}
                <rect
                  x="606"
                  y="198"
                  width="388"
                  height="388"
                  fill="url(#reva-edge-crimp)"
                  mask="url(#reva-perimeter-band-mask)"
                />
              </g>

              {/* Soft Fabric Cushion Rim Highlight */}
              <rect
                x="608"
                y="200"
                width="384"
                height="384"
                rx="66"
                fill="none"
                stroke="#E5EAD9"
                strokeOpacity="0.4"
                strokeWidth="2.2"
              />

              {/* Delicate Inner Perimeter Stitching Around Cushion */}
              <rect
                ref={stitchBorderRef}
                x="630"
                y="222"
                width="340"
                height="340"
                rx="48"
                fill="none"
                stroke="#6C7460"
                strokeOpacity="0.42"
                strokeWidth="1.35"
                strokeDasharray="5.5 4.5"
                strokeLinecap="round"
              />

              {/* Authentic REVA Logo with Subtle 2D Embossed/Debossed Highlights & Shadows */}
              <g ref={logoEmbossGroupRef} mask="url(#reva-logo-reveal-mask)">
                <g transform="rotate(-11.5 800 392)">
                  <image
                    ref={embossHighlightRef}
                    href="/extracted/reva-logo.webp"
                    x="679.8"
                    y="349.8"
                    width="244"
                    height="88"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#reva-emboss-light)"
                    opacity="0.52"
                  />
                  <image
                    ref={debossShadowRef}
                    href="/extracted/reva-logo.webp"
                    x="676.4"
                    y="346.4"
                    width="244"
                    height="88"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#reva-deboss-dark)"
                    opacity="0.5"
                  />
                  <image
                    href="/extracted/reva-logo.webp"
                    x="678"
                    y="348"
                    width="244"
                    height="88"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </g>
              </g>

              {/* Soft Broad Area of Light Sweeping Across Fabric */}
              <rect
                ref={lightSweepRef}
                x="280"
                y="160"
                width="340"
                height="470"
                transform="skewX(-22)"
                fill="url(#reva-raking-light)"
                opacity="0"
              />
            </g>
          </g>
        </g>

        {/* Scene 6: Single Crisp Tagline Reveal ("WHEN UR IDEAS NEED A RESET.") */}
        <g ref={taglineGroupRef} opacity="0">
          <line
            x1="772"
            y1="688"
            x2="828"
            y2="688"
            stroke="#5B6251"
            strokeOpacity="0.34"
            strokeWidth="1.6"
          />
          <text
            x="800"
            y="732"
            textAnchor="middle"
            fill="#3C4235"
            fontSize="23"
            fontWeight="500"
            letterSpacing="6.8"
          >
            WHEN UR IDEAS NEED A RESET.
          </text>
        </g>
      </svg>
    </div>
  );
}
