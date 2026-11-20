import React from "react";

/**
 * Complete manifest of all local image & artwork assets used by the five
 * 2D motion-graphics commercials AND all five first original mockups.
 * Preloaded and decoded eagerly in the background starting during the
 * introductory animation so clicking any project card starts at 0ms with
 * zero network requests and zero loading UI.
 */
export const MOTION_GRAPHICS_CRITICAL_ASSETS: readonly string[] = [
  // Authentic extracted 2D brand & packaging elements
  "/extracted/raymond-panel.webp",
  "/extracted/alhind-logo-clean.webp",
  "/extracted/paperboat-can-pomegranate.webp",
  "/extracted/paperboat-can-guava.webp",
  "/extracted/zambara-bottle.webp",
  "/extracted/zambara-front-label.webp",
  "/extracted/zambara-neck-label.webp",
  "/extracted/zambara-crest-clean.webp",
  "/extracted/zambara-glass.webp",
  "/extracted/reva-logo.webp",

  // All five FIRST ORIGINAL MOCKUPS (automatically revealed on completion)
  "/Raymond Design 1.jpeg",
  "/Ahind Air Design 1.jpeg",
  "/Paper Boat Design 1.jpeg",
  "/Zambara Design 1.jpeg",
  "/Reva Design 1.jpeg",

  // Static My Work cover WebPs & About portrait
  "/optimized/card/raymond-design-1.webp",
  "/optimized/card/paper-boat-design-1.webp",
  "/optimized/card/alhind-air-design-1.webp",
  "/optimized/card/zambara-design-1.webp",
  "/optimized/card/reva-design-1.webp",
  "/About Profile Pic.jpeg",
];

const pinnedImages = new Map<string, HTMLImageElement>();
const pendingDecodes = new Map<string, Promise<void>>();
let allPrepared = false;
let warmupPromise: Promise<void> | null = null;

export function preloadAndDecodeAsset(rawUrl: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const encoded = encodeURI(rawUrl);
  if (pinnedImages.has(encoded)) return Promise.resolve();

  const existing = pendingDecodes.get(encoded);
  if (existing) return existing;

  const task = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const finalize = () => {
      pinnedImages.set(encoded, img);
      pinnedImages.set(rawUrl, img);
      pendingDecodes.delete(encoded);
      resolve();
    };

    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finalize).catch(finalize);
      } else {
        finalize();
      }
    };
    img.onerror = () => {
      pendingDecodes.delete(encoded);
      resolve();
    };
    img.src = encoded;
  });

  pendingDecodes.set(encoded, task);
  return task;
}

/**
 * Starts immediately during the intro animation and decodes every 2D
 * commercial dependency + first original mockup into pinned memory.
 */
export function preloadAllMotionGraphicsAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (allPrepared) return Promise.resolve();
  if (warmupPromise) return warmupPromise;

  warmupPromise = Promise.all(
    MOTION_GRAPHICS_CRITICAL_ASSETS.map((src) => preloadAndDecodeAsset(src))
  ).then(() => {
    allPrepared = true;
  });

  return warmupPromise;
}

export function areMotionGraphicsAssetsPrepared(): boolean {
  return allPrepared;
}

/**
 * Hidden 1x1px offscreen GPU/compositor bitmap warmer mounted silently in App.
 * Ensures every 2D commercial bitmap is already uploaded to the browser's
 * image cache before a visitor ever clicks a project card — without running
 * any animations.
 */
export function PrewarmedCommercialAssetBank() {
  const brandSprites = MOTION_GRAPHICS_CRITICAL_ASSETS.slice(0, 16);
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -9999,
        top: -9999,
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0.001,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      {brandSprites.map((src) => (
        <img
          key={src}
          src={encodeURI(src)}
          alt=""
          width={16}
          height={16}
          loading="eager"
          decoding="sync"
        />
      ))}
    </div>
  );
}
