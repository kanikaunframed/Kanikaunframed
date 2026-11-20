import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Maximize2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Images,
  Share2,
  Link2,
  Copy,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { MotionGraphicsViewerStage } from "../motionGraphics/MotionGraphicsViewerStage";
import { preloadAllMotionGraphicsAssets } from "../motionGraphics/preloadAssets";

export interface DesignVariation {
  src: string;
  cardWebp: string;
  thumbWebp: string;
  width: number;
  height: number;
  label: string;
  slug: string;
}

export interface PortfolioProject {
  id: number;
  slug: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  coverImage: string;
  coverWebp: string;
  coverWidth: number;
  coverHeight: number;
  designs: DesignVariation[];
}

const PROJECTS: PortfolioProject[] = [
  {
    id: 1,
    slug: "raymond",
    title: "The Art Of Being Refined",
    brand: "RAYMOND",
    category: "Luxury Packaging & Identity",
    description:
      "This project explores the rebranding of Raymond from “The Complete Man” to “The Complete You,” bringing menswear and womenswear together under one identity. The refreshed brand expression extends across shopping bags, billboard advertising, and social media, blending Raymond’s timeless elegance with a more inclusive and contemporary approach.",
    coverImage: "/Raymond Design 1.jpeg",
    coverWebp: "/optimized/card/raymond-design-1.webp",
    coverWidth: 1254,
    coverHeight: 1254,
    designs: [
      {
        src: "/Raymond Design 1.jpeg",
        cardWebp: "/optimized/card/raymond-design-1.webp",
        thumbWebp: "/optimized/thumb/raymond-design-1.webp",
        width: 1254,
        height: 1254,
        label: "Raymond Design 1",
        slug: "raymond-design-1",
      },
      {
        src: "/Raymond Design 2.jpeg",
        cardWebp: "/optimized/card/raymond-design-2.webp",
        thumbWebp: "/optimized/thumb/raymond-design-2.webp",
        width: 1254,
        height: 1254,
        label: "Raymond Design 2",
        slug: "raymond-design-2",
      },
      {
        src: "/Raymond Design 3.jpeg",
        cardWebp: "/optimized/card/raymond-design-3.webp",
        thumbWebp: "/optimized/thumb/raymond-design-3.webp",
        width: 1058,
        height: 1486,
        label: "Raymond Design 3",
        slug: "raymond-design-3",
      },
    ],
  },
  {
    id: 2,
    slug: "paper-boat",
    title: "A Sip of Nostalgia",
    brand: "PAPER BOAT",
    category: "Packaging & Brand Campaign",
    description:
      "This project explores the use of bold colours, playful typography, and vibrant fruit illustrations to give Paper Boat Swing a more youthful, fun, and refreshing identity while staying true to the brand’s original essence.",
    coverImage: "/Paper Boat Design 1.jpeg",
    coverWebp: "/optimized/card/paper-boat-design-1.webp",
    coverWidth: 1254,
    coverHeight: 1254,
    designs: [
      {
        src: "/Paper Boat Design 1.jpeg",
        cardWebp: "/optimized/card/paper-boat-design-1.webp",
        thumbWebp: "/optimized/thumb/paper-boat-design-1.webp",
        width: 1254,
        height: 1254,
        label: "Paper Boat Design 1",
        slug: "paper-boat-design-1",
      },
      {
        src: "/Paper Boat Design 2.jpeg",
        cardWebp: "/optimized/card/paper-boat-design-2.webp",
        thumbWebp: "/optimized/thumb/paper-boat-design-2.webp",
        width: 1254,
        height: 1254,
        label: "Paper Boat Design 2",
        slug: "paper-boat-design-2",
      },
      {
        src: "/Paper Boat Design 3.jpeg",
        cardWebp: "/optimized/card/paper-boat-design-3.webp",
        thumbWebp: "/optimized/thumb/paper-boat-design-3.webp",
        width: 1254,
        height: 1254,
        label: "Paper Boat Design 3",
        slug: "paper-boat-design-3",
      },
    ],
  },
  {
    id: 3,
    slug: "alhind-air",
    title: "Beyond The Horizon",
    brand: "ALHIND AIR",
    category: "Brand Identity & Visual System",
    description:
      "This project explores the branding of Alhind Air, an Indian airline connecting India and the Middle East. The identity combines modern typography, a thoughtful colour palette, and clean visual elements across the logo, aircraft branding, boarding pass, and cabin seats, creating a cohesive and welcoming brand experience.",
    coverImage: "/Ahind Air Design 1.jpeg",
    coverWebp: "/optimized/card/alhind-air-design-1.webp",
    coverWidth: 1448,
    coverHeight: 1086,
    designs: [
      {
        src: "/Ahind Air Design 1.jpeg",
        cardWebp: "/optimized/card/alhind-air-design-1.webp",
        thumbWebp: "/optimized/thumb/alhind-air-design-1.webp",
        width: 1448,
        height: 1086,
        label: "Alhind Air Design 1",
        slug: "alhind-air-design-1",
      },
      {
        src: "/Ahind Air Design 2.jpeg",
        cardWebp: "/optimized/card/alhind-air-design-2.webp",
        thumbWebp: "/optimized/thumb/alhind-air-design-2.webp",
        width: 1600,
        height: 640,
        label: "Alhind Air Design 2",
        slug: "alhind-air-design-2",
      },
      {
        src: "/Ahind Air Design 3.jpeg",
        cardWebp: "/optimized/card/alhind-air-design-3.webp",
        thumbWebp: "/optimized/thumb/alhind-air-design-3.webp",
        width: 616,
        height: 472,
        label: "Alhind Air Design 3",
        slug: "alhind-air-design-3",
      },
      {
        src: "/Ahind Air Design 4.jpeg",
        cardWebp: "/optimized/card/alhind-air-design-4.webp",
        thumbWebp: "/optimized/thumb/alhind-air-design-4.webp",
        width: 1600,
        height: 900,
        label: "Alhind Air Design 4",
        slug: "alhind-air-design-4",
      },
    ],
  },
  {
    id: 4,
    slug: "alcohol-zambara",
    title: "A Taste Of The Untamed",
    brand: "ALCOHOL ZAMBARA",
    category: "Visual Communication & Branding",
    description:
      "This project explores the packaging design of a premium African cream liqueur inspired by African culture and aesthetics. Using bold geometric patterns, earthy tones, and tribal-inspired visuals, I created a cohesive packaging system with a strong premium identity and shelf appeal.",
    coverImage: "/Zambara Design 1.jpeg",
    coverWebp: "/optimized/card/zambara-design-1.webp",
    coverWidth: 1024,
    coverHeight: 1536,
    designs: [
      {
        src: "/Zambara Design 1.jpeg",
        cardWebp: "/optimized/card/zambara-design-1.webp",
        thumbWebp: "/optimized/thumb/zambara-design-1.webp",
        width: 1024,
        height: 1536,
        label: "Alcohol Zambara Design 1",
        slug: "zambara-design-1",
      },
      {
        src: "/Zambara Design 2.jpeg",
        cardWebp: "/optimized/card/zambara-design-2.webp",
        thumbWebp: "/optimized/thumb/zambara-design-2.webp",
        width: 1024,
        height: 1536,
        label: "Alcohol Zambara Design 2",
        slug: "zambara-design-2",
      },
      {
        src: "/Zambara Design 3.jpeg",
        cardWebp: "/optimized/card/zambara-design-3.webp",
        thumbWebp: "/optimized/thumb/zambara-design-3.webp",
        width: 1487,
        height: 1058,
        label: "Alcohol Zambara Design 3",
        slug: "zambara-design-3",
      },
    ],
  },
  {
    id: 5,
    slug: "reva",
    title: "Recovery, Reimagined",
    brand: "REVA",
    category: "Packaging & Brand Experience",
    description:
      "This project explores recovery through REVA, a recovery patch brand inspired by strength and renewal. Sage green tones, elegant typography, and minimal packaging create a calm, balanced identity that reflects the idea of resetting and coming back stronger.",
    coverImage: "/Reva Design 1.jpeg",
    coverWebp: "/optimized/card/reva-design-1.webp",
    coverWidth: 855,
    coverHeight: 1024,
    designs: [
      {
        src: "/Reva Design 1.jpeg",
        cardWebp: "/optimized/card/reva-design-1.webp",
        thumbWebp: "/optimized/thumb/reva-design-1.webp",
        width: 855,
        height: 1024,
        label: "Reva Design 1",
        slug: "reva-design-1",
      },
      {
        src: "/Reva Design 2.jpeg",
        cardWebp: "/optimized/card/reva-design-2.webp",
        thumbWebp: "/optimized/thumb/reva-design-2.webp",
        width: 677,
        height: 477,
        label: "Reva Design 2",
        slug: "reva-design-2",
      },
      {
        src: "/Reva Design 3.jpeg",
        cardWebp: "/optimized/card/reva-design-3.webp",
        thumbWebp: "/optimized/thumb/reva-design-3.webp",
        width: 1411,
        height: 1115,
        label: "Reva Design 3",
        slug: "reva-design-3",
      },
      {
        src: "/Reva Design 4.jpeg",
        cardWebp: "/optimized/card/reva-design-4.webp",
        thumbWebp: "/optimized/thumb/reva-design-4.webp",
        width: 1492,
        height: 1054,
        label: "Reva Design 4",
        slug: "reva-design-4",
      },
    ],
  },
];

export const MY_WORK_PROJECTS: readonly PortfolioProject[] = PROJECTS;

const decodedUrls = new Set<string>();
const retainedImages = new Map<string, HTMLImageElement>();
const inflightPreloads = new Map<string, Promise<void>>();

function preloadSingleAsset(rawSrc: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const encoded = encodeURI(rawSrc);
  if (decodedUrls.has(encoded)) return Promise.resolve();
  const existing = inflightPreloads.get(encoded);
  if (existing) return existing;

  const task = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const done = () => {
      decodedUrls.add(encoded);
      decodedUrls.add(rawSrc);
      retainedImages.set(encoded, img);
      inflightPreloads.delete(encoded);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = () => {
      inflightPreloads.delete(encoded);
      resolve();
    };
    img.src = encoded;
  });

  inflightPreloads.set(encoded, task);
  return task;
}

function preloadProjectDesigns(
  project: PortfolioProject,
  priorityIndex = 0
): void {
  if (typeof window === "undefined") return;

  const list = project.designs;
  if (!list.length) return;

  const primary = list[priorityIndex] ?? list[0];
  preloadSingleAsset(primary.src);
  preloadSingleAsset(primary.thumbWebp);

  const nextIdx = (priorityIndex + 1) % list.length;
  const prevIdx = (priorityIndex - 1 + list.length) % list.length;

  if (nextIdx !== priorityIndex) {
    preloadSingleAsset(list[nextIdx].src);
    preloadSingleAsset(list[nextIdx].thumbWebp);
  }
  if (prevIdx !== priorityIndex && prevIdx !== nextIdx) {
    preloadSingleAsset(list[prevIdx].src);
    preloadSingleAsset(list[prevIdx].thumbWebp);
  }

  list.forEach((d, idx) => {
    preloadSingleAsset(d.thumbWebp);
    if (idx !== priorityIndex && idx !== nextIdx && idx !== prevIdx) {
      preloadSingleAsset(d.src);
    }
  });
}

let hasWarmedUp = false;
export function warmUpPortfolioAssets(): void {
  if (typeof window === "undefined" || hasWarmedUp) return;
  hasWarmedUp = true;
  // Preload & decode all 2D commercial assets + all five first original mockups in background
  void preloadAllMotionGraphicsAssets();
  preloadSingleAsset("/About Profile Pic.jpeg");
  PROJECTS.forEach((p) => {
    preloadSingleAsset(p.coverWebp);
    if (p.designs[0]) {
      preloadSingleAsset(p.designs[0].src);
    }
  });
}

function normalizeSlugToken(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.(jpeg|jpg|png|webp|svg)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveDeepLinkFromSearch(
  search: string
): { project: PortfolioProject; designIndex: number } | null {
  if (!search) return null;
  const params = new URLSearchParams(search);
  const rawProject = params.get("project");
  const rawDesign = params.get("design");

  if (!rawProject && !rawDesign) return null;

  let matchedProject: PortfolioProject | undefined;
  if (rawProject) {
    const token = normalizeSlugToken(rawProject);
    matchedProject = PROJECTS.find(
      (p) =>
        p.slug === token ||
        normalizeSlugToken(p.brand) === token ||
        normalizeSlugToken(p.title) === token ||
        String(p.id) === token ||
        `graphic-design-${p.id}` === token ||
        (p.slug === "alhind-air" && token === "ahind-air") ||
        (p.slug === "alcohol-zambara" && token === "zambara")
    );
    if (!matchedProject) return null;
  }

  if (rawDesign) {
    const token = normalizeSlugToken(rawDesign);
    if (matchedProject) {
      const asNum = Number(rawDesign);
      if (
        Number.isInteger(asNum) &&
        asNum >= 1 &&
        asNum <= matchedProject.designs.length
      ) {
        return { project: matchedProject, designIndex: asNum - 1 };
      }
      const idx = matchedProject.designs.findIndex(
        (d, i) =>
          d.slug === token ||
          normalizeSlugToken(d.label) === token ||
          normalizeSlugToken(d.src) === token ||
          `design-${i + 1}` === token
      );
      return idx === -1 ? null : { project: matchedProject, designIndex: idx };
    } else {
      for (const proj of PROJECTS) {
        const idx = proj.designs.findIndex(
          (d) =>
            d.slug === token ||
            normalizeSlugToken(d.label) === token ||
            normalizeSlugToken(d.src) === token
        );
        if (idx !== -1) {
          return { project: proj, designIndex: idx };
        }
      }
      return null;
    }
  }

  return matchedProject ? { project: matchedProject, designIndex: 0 } : null;
}

function buildShareUrl(project: PortfolioProject, designIndex: number): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("project", project.slug);
  url.searchParams.set("design", String(designIndex + 1));
  return url.toString();
}

export function clearDeepLinkParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("project") || url.searchParams.has("design")) {
    url.searchParams.delete("project");
    url.searchParams.delete("design");
    const next =
      url.pathname +
      (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
      url.hash;
    window.history.replaceState(null, "", next);
  }
}

function syncDeepLinkParamsToUrl(
  project: PortfolioProject,
  designIndex: number
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("project", project.slug);
  url.searchParams.set("design", String(designIndex + 1));
  const next = `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
  window.history.replaceState(null, "", next);
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

interface TransformState {
  scale: number;
  x: number;
  y: number;
}

const DEFAULT_TRANSFORM: TransformState = { scale: MIN_ZOOM, x: 0, y: 0 };

function getDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

interface PreviewModalProps {
  key?: React.Key;
  project: PortfolioProject;
  initialDesignIndex?: number;
  isSuspended?: boolean;
  onClose: () => void;
}

function PreviewModal({
  project,
  initialDesignIndex = 0,
  isSuspended = false,
  onClose,
}: PreviewModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    initialDesignIndex >= 0 && initialDesignIndex < project.designs.length
      ? initialDesignIndex
      : 0
  );
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const transformRef = useRef<TransformState>(DEFAULT_TRANSFORM);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const transformLayerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map()
  );
  const dragSessionRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false,
  });
  const pinchSessionRef = useRef<{
    initialDistance: number;
    initialScale: number;
    originX: number;
    originY: number;
  } | null>(null);

  const currentDesign =
    project.designs[selectedIndex] ?? project.designs[0];
  const shareUrl = buildShareUrl(project, selectedIndex);

  const applyTransform = useCallback((next: TransformState) => {
    const normalized: TransformState =
      next.scale <= MIN_ZOOM
        ? DEFAULT_TRANSFORM
        : {
            scale: Math.min(Math.max(next.scale, MIN_ZOOM), MAX_ZOOM),
            x: Math.round(next.x),
            y: Math.round(next.y),
          };
    transformRef.current = normalized;
    setTransform(normalized);
  }, []);

  const clampPan = useCallback(
    (pos: { x: number; y: number }, targetScale: number) => {
      if (targetScale <= MIN_ZOOM) return { x: 0, y: 0 };
      const stage = stageRef.current;
      const img = imageRef.current;
      if (!stage) return pos;
      const rect = stage.getBoundingClientRect();
      const imgW =
        img && img.offsetWidth > 0 ? img.offsetWidth : rect.width * 0.8;
      const imgH =
        img && img.offsetHeight > 0 ? img.offsetHeight : rect.height * 0.8;
      const maxX = Math.max(
        (imgW * (targetScale - 1)) / 2,
        (imgW * targetScale - rect.width * 0.45) / 2,
        0
      );
      const maxY = Math.max(
        (imgH * (targetScale - 1)) / 2,
        (imgH * targetScale - rect.height * 0.45) / 2,
        0
      );
      return {
        x: Math.min(Math.max(pos.x, -maxX), maxX),
        y: Math.min(Math.max(pos.y, -maxY), maxY),
      };
    },
    []
  );

  const resetZoomState = useCallback(() => {
    activePointersRef.current.clear();
    pinchSessionRef.current = null;
    dragSessionRef.current.pointerId = null;
    dragSessionRef.current.hasMoved = false;
    setIsInteracting(false);
    applyTransform(DEFAULT_TRANSFORM);
  }, [applyTransform]);

  const selectVariation = useCallback(
    (idx: number) => {
      setHasImageError(false);
      setSelectedIndex(idx);
      resetZoomState();
      setCopied(false);
    },
    [resetZoomState]
  );

  const goPrev = useCallback(() => {
    setHasImageError(false);
    setSelectedIndex((prev) =>
      prev > 0 ? prev - 1 : project.designs.length - 1
    );
    resetZoomState();
    setCopied(false);
  }, [project.designs.length, resetZoomState]);

  const goNext = useCallback(() => {
    setHasImageError(false);
    setSelectedIndex((prev) =>
      prev < project.designs.length - 1 ? prev + 1 : 0
    );
    resetZoomState();
    setCopied(false);
  }, [project.designs.length, resetZoomState]);

  useEffect(() => {
    preloadProjectDesigns(project, selectedIndex);
  }, [project, selectedIndex]);

  useEffect(() => {
    const safeIdx =
      initialDesignIndex >= 0 && initialDesignIndex < project.designs.length
        ? initialDesignIndex
        : 0;
    setHasImageError(false);
    setSelectedIndex(safeIdx);
    resetZoomState();
    setIsGalleryOpen(false);
    setIsShareOpen(false);
    setCopied(false);
  }, [project.id, initialDesignIndex, project.designs.length, resetZoomState]);

  useEffect(() => {
    syncDeepLinkParamsToUrl(project, selectedIndex);
  }, [project, selectedIndex]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const btn = thumbRefs.current[selectedIndex];
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex, isGalleryOpen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleZoomIn = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setIsInteracting(false);
      const cur = transformRef.current;
      if (cur.scale >= MAX_ZOOM) return;
      const nextScale = Math.min(
        Number((cur.scale + ZOOM_STEP).toFixed(2)),
        MAX_ZOOM
      );
      const ratio = nextScale / cur.scale;
      const clamped = clampPan(
        { x: Math.round(cur.x * ratio), y: Math.round(cur.y * ratio) },
        nextScale
      );
      applyTransform({ scale: nextScale, x: clamped.x, y: clamped.y });
    },
    [applyTransform, clampPan]
  );

  const handleZoomOutReset = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      resetZoomState();
    },
    [resetZoomState]
  );

  useEffect(() => {
    let rafId: number | null = null;
    const onResize = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          const cur = transformRef.current;
          if (cur.scale <= MIN_ZOOM) {
            if (cur.x !== 0 || cur.y !== 0) applyTransform(DEFAULT_TRANSFORM);
            return;
          }
          const clamped = clampPan({ x: cur.x, y: cur.y }, cur.scale);
          applyTransform({ scale: cur.scale, x: clamped.x, y: clamped.y });
        });
      }
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [applyTransform, clampPan]);

  const handleCopyShareUrl = useCallback(async () => {
    const url = buildShareUrl(project, selectedIndex);
    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok && shareInputRef.current) {
      try {
        shareInputRef.current.focus();
        shareInputRef.current.select();
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2400);
    } else if (shareInputRef.current) {
      shareInputRef.current.focus();
      shareInputRef.current.select();
    }
  }, [project, selectedIndex]);

  const handleShareToggle = useCallback(async () => {
    setIsGalleryOpen(false);
    const url = buildShareUrl(project, selectedIndex);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${currentDesign.label} — ${project.brand} | Kanika’s Portfolio`,
          text: `${project.title} (${project.brand}) — ${currentDesign.label}`,
          url,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    setIsShareOpen((prev) => !prev);
  }, [project, selectedIndex, currentDesign.label]);

  const handleGalleryToggle = useCallback(() => {
    setIsShareOpen(false);
    setIsGalleryOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isSuspended) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isShareOpen) {
          setIsShareOpen(false);
          return;
        }
        if (isGalleryOpen) {
          setIsGalleryOpen(false);
          return;
        }
        onClose();
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === "-" || e.key === "0") {
        e.preventDefault();
        handleZoomOutReset();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isSuspended,
    isShareOpen,
    isGalleryOpen,
    onClose,
    handleZoomIn,
    handleZoomOutReset,
    goPrev,
    goNext,
  ]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cur = transformRef.current;
      const delta = -e.deltaY * 0.0035;
      const nextScale = Math.min(
        Math.max(MIN_ZOOM, Number((cur.scale + delta).toFixed(2))),
        MAX_ZOOM
      );
      if (nextScale <= MIN_ZOOM) {
        applyTransform(DEFAULT_TRANSFORM);
        return;
      }
      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      const ratio = nextScale / cur.scale;
      const rawX = offsetX - (offsetX - cur.x) * ratio;
      const rawY = offsetY - (offsetY - cur.y) * ratio;
      const clamped = clampPan({ x: rawX, y: rawY }, nextScale);
      applyTransform({ scale: nextScale, x: clamped.x, y: clamped.y });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyTransform, clampPan]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from<{ x: number; y: number }>(
        activePointersRef.current.values()
      );
      const dist = getDistance(pts[0], pts[1]);
      const cur = transformRef.current;
      pinchSessionRef.current = {
        initialDistance: Math.max(dist, 10),
        initialScale: cur.scale,
        originX: cur.x,
        originY: cur.y,
      };
      dragSessionRef.current.pointerId = null;
      setIsInteracting(true);
      return;
    }

    if (activePointersRef.current.size === 1) {
      const cur = transformRef.current;
      dragSessionRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: cur.x,
        originY: cur.y,
        hasMoved: false,
      };
      if (cur.scale > MIN_ZOOM) setIsInteracting(true);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    if (activePointersRef.current.size === 2 && pinchSessionRef.current) {
      const pts = Array.from<{ x: number; y: number }>(
        activePointersRef.current.values()
      );
      const dist = getDistance(pts[0], pts[1]);
      const session = pinchSessionRef.current;
      const raw =
        session.initialScale * (dist / Math.max(session.initialDistance, 10));
      const nextScale = Math.min(
        Math.max(MIN_ZOOM, Number(raw.toFixed(2))),
        MAX_ZOOM
      );
      if (nextScale <= MIN_ZOOM) {
        applyTransform(DEFAULT_TRANSFORM);
      } else {
        const ratio = nextScale / Math.max(session.initialScale, MIN_ZOOM);
        const clamped = clampPan(
          { x: session.originX * ratio, y: session.originY * ratio },
          nextScale
        );
        applyTransform({ scale: nextScale, x: clamped.x, y: clamped.y });
      }
      return;
    }

    const drag = dragSessionRef.current;
    if (drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.hasMoved && Math.hypot(dx, dy) > 3) {
      drag.hasMoved = true;
      if (
        transformRef.current.scale > MIN_ZOOM &&
        !e.currentTarget.hasPointerCapture(e.pointerId)
      ) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors
        }
      }
    }

    const cur = transformRef.current;
    if (cur.scale <= MIN_ZOOM) return;
    const clamped = clampPan(
      { x: drag.originX + dx, y: drag.originY + dy },
      cur.scale
    );
    applyTransform({ scale: cur.scale, x: clamped.x, y: clamped.y });
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragSessionRef.current;
    const wasSingle =
      activePointersRef.current.size === 1 && drag.pointerId === e.pointerId;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    activePointersRef.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore release errors
      }
    }

    if (
      wasSingle &&
      e.pointerType === "touch" &&
      transformRef.current.scale <= MIN_ZOOM &&
      Math.abs(dx) > 56 &&
      Math.abs(dx) > Math.abs(dy) * 1.6
    ) {
      if (dx < 0) goNext();
      else goPrev();
    }

    if (activePointersRef.current.size < 2) {
      pinchSessionRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      dragSessionRef.current.pointerId = null;
      setIsInteracting(false);
      if (transformRef.current.scale <= 1.02) {
        applyTransform(DEFAULT_TRANSFORM);
      }
    }
  };

  const handleStageDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (transformRef.current.scale > MIN_ZOOM) {
      resetZoomState();
      return;
    }
    const el = stageRef.current;
    const targetScale = 2;
    if (!el) {
      applyTransform({ scale: targetScale, x: 0, y: 0 });
      return;
    }
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    const clamped = clampPan(
      { x: -offsetX * 0.6, y: -offsetY * 0.6 },
      targetScale
    );
    applyTransform({ scale: targetScale, x: clamped.x, y: clamped.y });
  };

  const isMaxZoom = transform.scale >= MAX_ZOOM;
  const isDefaultZoom =
    transform.scale <= MIN_ZOOM && transform.x === 0 && transform.y === 0;

  return createPortal(
    <motion.div
      data-testid="project-first-mockup-viewer"
      data-viewer-suspended={isSuspended ? "true" : "false"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-0 z-[100] flex flex-col select-none overflow-hidden ${
        isSuspended ? "bg-white" : "bg-white/95 backdrop-blur-2xl"
      }`}
    >
      {/* Top Bar */}
      <div
        className={`flex items-center justify-between px-4 sm:px-6 md:px-10 py-3.5 border-b border-black/5 z-30 shrink-0 ${
          isSuspended ? "bg-white" : "bg-white/85 backdrop-blur-xl"
        }`}
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
            aria-label="Back to My Work"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to My Work</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-zinc-900 tracking-tight truncate">
                {project.title}
              </h3>
              <span
                className="text-zinc-400 font-medium select-none"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 shrink-0 tabular-nums">
                {selectedIndex + 1} / {project.designs.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {transform.scale > MIN_ZOOM && (
            <button
              type="button"
              onClick={handleZoomOutReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-700 text-xs font-medium transition-all cursor-pointer tabular-nums"
              title="Fit to Screen (100%)"
              aria-label="Fit to Screen"
            >
              <span>{Math.round(transform.scale * 100)}% · Fit</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="relative flex-1 min-h-0 w-full flex flex-col md:flex-row overflow-hidden bg-zinc-50/60">
        <aside
          onClick={(e) => {
            e.stopPropagation();
            if (isGalleryOpen || isShareOpen) {
              setIsGalleryOpen(false);
              setIsShareOpen(false);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-label="Project Information"
          className={`w-full md:w-72 lg:w-88 xl:w-100 shrink-0 max-h-[22vh] sm:max-h-[25vh] md:max-h-full md:h-full overflow-y-auto border-b md:border-b-0 md:border-r border-black/[0.06] px-4 py-3 sm:px-6 sm:py-4 md:px-7 md:py-8 lg:px-9 lg:py-10 flex flex-col md:justify-center select-text z-10 ${
            isSuspended ? "bg-white" : "bg-white/80 backdrop-blur-xl"
          }`}
        >
          <div className="max-w-md">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1 md:mb-2.5">
              {project.brand}
            </span>
            <h2 className="text-base sm:text-xl md:text-2xl lg:text-[26px] font-semibold text-zinc-900 tracking-tight leading-snug mb-1.5 md:mb-4">
              {project.title}
            </h2>
            <p className="text-xs sm:text-sm md:text-[15px] text-zinc-600 font-light leading-relaxed">
              {project.description}
            </p>
          </div>
        </aside>

        <div className="relative flex-1 min-w-0 min-h-0 w-full h-full flex flex-col items-center justify-between lg:justify-center overflow-y-auto lg:overflow-hidden px-3 py-2 sm:px-5 sm:py-3 lg:p-0">
          <div
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
            onDoubleClick={handleStageDoubleClick}
            onClick={(e) => {
              if (dragSessionRef.current.hasMoved) {
                dragSessionRef.current.hasMoved = false;
                return;
              }
              if (isGalleryOpen || isShareOpen) {
                setIsGalleryOpen(false);
                setIsShareOpen(false);
                return;
              }
              if (
                (e.target === e.currentTarget ||
                  e.target === transformLayerRef.current) &&
                transformRef.current.scale <= MIN_ZOOM
              ) {
                onClose();
              }
            }}
            style={{ touchAction: "none" }}
            className={`relative w-full flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-4 lg:p-12 lg:pr-28 lg:h-full ${
              isGalleryOpen || isShareOpen
                ? "min-h-[160px] sm:min-h-[220px]"
                : "min-h-[220px] sm:min-h-[300px]"
            }`}
          >
            <div
              ref={transformLayerRef}
              style={{
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                transformOrigin: "center center",
                transition: isInteracting
                  ? "none"
                  : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "transform",
              }}
              className="w-full h-full flex items-center justify-center pointer-events-none"
            >
              {hasImageError ? (
                <div className="pointer-events-auto flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/90 border border-black/10 shadow-sm text-center max-w-xs">
                  <AlertCircle size={22} className="text-zinc-500" />
                  <p className="text-xs sm:text-sm text-zinc-600">
                    Unable to load {currentDesign.label}.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasImageError(false);
                    }}
                    className="px-4 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <img
                  ref={imageRef}
                  src={encodeURI(currentDesign.src)}
                  alt={currentDesign.label}
                  width={currentDesign.width}
                  height={currentDesign.height}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  draggable={false}
                  onLoad={() => {
                    decodedUrls.add(encodeURI(currentDesign.src));
                    decodedUrls.add(currentDesign.src);
                    if (transformRef.current.scale <= MIN_ZOOM) {
                      applyTransform(DEFAULT_TRANSFORM);
                    }
                  }}
                  onError={() => setHasImageError(true)}
                  onClick={(e) => {
                    if (
                      !dragSessionRef.current.hasMoved &&
                      (isGalleryOpen || isShareOpen)
                    ) {
                      e.stopPropagation();
                      setIsGalleryOpen(false);
                      setIsShareOpen(false);
                    }
                  }}
                  style={{
                    cursor:
                      transform.scale > MIN_ZOOM
                        ? isInteracting
                          ? "grabbing"
                          : "grab"
                        : "zoom-in",
                    touchAction: "none",
                  }}
                  className="pointer-events-auto max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-sm select-none"
                />
              )}
            </div>
          </div>

          {/* Floating Controls Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            role="toolbar"
            aria-label="Previewer Controls"
            className={`relative z-30 shrink-0 mx-auto my-1.5 sm:my-2.5 lg:my-0 lg:mx-0 lg:absolute lg:right-6 lg:top-1/2 lg:-translate-y-1/2 flex flex-row lg:flex-col flex-nowrap items-center justify-center gap-1.5 sm:gap-2 lg:gap-2.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 lg:p-2.5 max-w-[calc(100vw-1.5rem)] overflow-x-auto lg:overflow-visible rounded-full border border-white/90 ring-1 ring-black/[0.08] shadow-[0_14px_44px_rgba(0,0,0,0.12)] ${
              isSuspended ? "bg-white" : "bg-white/85 backdrop-blur-2xl"
            }`}
          >
            <button
              type="button"
              onClick={goNext}
              title="Next Design (Right Arrow)"
              aria-label="Next Design"
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white text-zinc-950 border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight size={19} strokeWidth={2.1} />
            </button>
            <button
              type="button"
              onClick={goPrev}
              title="Previous Design (Left Arrow)"
              aria-label="Previous Design"
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white text-zinc-950 border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft size={19} strokeWidth={2.1} />
            </button>

            <div
              className="w-px h-5 sm:h-6 lg:w-7 lg:h-px bg-zinc-200/90 mx-0.5 lg:mx-0 lg:my-0.5 shrink-0"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={isMaxZoom}
              title={
                isMaxZoom ? "Maximum Zoom Reached (400%)" : "Zoom In (+)"
              }
              aria-label="Zoom In"
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white text-zinc-950 border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer"
            >
              <ZoomIn size={19} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleZoomOutReset}
              title={
                isDefaultZoom
                  ? "Default Fitted Size (100%)"
                  : "Zoom Out to Full View (-)"
              }
              aria-label="Zoom Out"
              className={`w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white text-zinc-950 border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer ${
                isDefaultZoom ? "opacity-50" : "opacity-100"
              }`}
            >
              <ZoomOut size={19} strokeWidth={2} />
            </button>

            <div
              className="w-px h-5 sm:h-6 lg:w-7 lg:h-px bg-zinc-200/90 mx-0.5 lg:mx-0 lg:my-0.5 shrink-0"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={handleGalleryToggle}
              aria-expanded={isGalleryOpen}
              title={
                isGalleryOpen
                  ? "Hide Project Gallery"
                  : `View ${project.brand} Gallery (${project.designs.length} ${
                      project.designs.length === 1 ? "Mockup" : "Mockups"
                    })`
              }
              aria-label="Toggle Design Gallery"
              className={`w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer ${
                isGalleryOpen
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                  : "bg-white text-zinc-950 border-black/[0.05] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
              }`}
            >
              <Images size={18} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={handleShareToggle}
              aria-expanded={isShareOpen}
              title={`Share ${currentDesign.label}`}
              aria-label={`Share ${currentDesign.label}`}
              className={`w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full border shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer ${
                isShareOpen
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                  : "bg-white text-zinc-950 border-black/[0.05] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
              }`}
            >
              <Share2 size={18} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Viewer (Esc)"
              aria-label="Close Viewer"
              className="w-9 h-9 min-[390px]:w-10 min-[390px]:h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white text-zinc-950 border border-black/[0.05] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:bg-zinc-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={19} strokeWidth={2.1} />
            </button>
          </div>

          {/* Variations Gallery Drawer */}
          <AnimatePresence>
            {isGalleryOpen && (
              <motion.aside
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-label={`${project.brand} Design Variations`}
                className="relative w-full max-w-md sm:max-w-lg mx-auto mt-1 mb-1 h-56 sm:h-64 max-h-[34vh] shrink-0 lg:m-0 lg:absolute lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:right-24 lg:w-96 lg:h-auto lg:max-h-[calc(100%-3rem)] z-30 flex flex-col rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 ring-1 ring-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.16)] overflow-hidden"
              >
                <div className="px-4 sm:px-5 py-3.5 border-b border-black/[0.06] bg-white/60 flex items-center justify-between shrink-0">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 truncate">
                        {project.title}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-900/5 text-zinc-600 tabular-nums shrink-0">
                        {selectedIndex + 1} / {project.designs.length}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-zinc-900 tracking-tight truncate mt-0.5">
                      {project.brand} Gallery
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(false)}
                    className="p-2 rounded-full bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                    title="Close Gallery (Esc)"
                    aria-label="Close Gallery"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 grid grid-cols-1 gap-3 scroll-smooth">
                  {project.designs.map((design, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={design.src}
                        ref={(el) => {
                          thumbRefs.current[idx] = el;
                        }}
                        type="button"
                        onClick={() => selectVariation(idx)}
                        className={`group w-full text-left rounded-2xl p-2.5 transition-all duration-150 cursor-pointer border flex flex-col gap-2 ${
                          isSelected
                            ? "bg-zinc-900/[0.05] border-zinc-900 ring-2 ring-zinc-900/15 shadow-sm"
                            : "bg-white/80 hover:bg-white border-black/[0.07] hover:border-zinc-300"
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-xl bg-zinc-50/90 border border-black/5 overflow-hidden flex items-center justify-center p-2">
                          <picture className="w-full h-full flex items-center justify-center">
                            <source
                              srcSet={design.thumbWebp}
                              type="image/webp"
                            />
                            <img
                              src={encodeURI(design.src)}
                              alt={design.label}
                              width={design.width}
                              height={design.height}
                              decoding="async"
                              draggable={false}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          </picture>
                        </div>
                        <div className="flex items-center justify-between px-1 gap-2">
                          <span
                            className={`text-xs sm:text-sm tracking-tight truncate ${
                              isSelected
                                ? "font-semibold text-zinc-900"
                                : "font-medium text-zinc-600 group-hover:text-zinc-900"
                            }`}
                          >
                            {design.label}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                              isSelected
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            0{idx + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Share Link Popover */}
          <AnimatePresence>
            {isShareOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Share this design"
                className="relative w-full max-w-md sm:max-w-lg mx-auto mt-1 mb-1 shrink-0 lg:m-0 lg:absolute lg:inset-x-auto lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:right-24 lg:w-88 z-30 rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 ring-1 ring-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.16)] p-4 sm:p-5 flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Link2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 tracking-tight truncate">
                        Share Design Link
                      </h4>
                      <p className="text-xs text-zinc-500 truncate">
                        {project.brand} • {currentDesign.label}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShareOpen(false)}
                    className="p-1.5 rounded-full bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                    aria-label="Close Share Panel"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-50/90 border border-black/[0.06]">
                  <div className="w-14 h-10 rounded-lg bg-white border border-black/5 overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <picture className="w-full h-full flex items-center justify-center">
                      <source
                        srcSet={currentDesign.thumbWebp}
                        type="image/webp"
                      />
                      <img
                        src={encodeURI(currentDesign.src)}
                        alt={currentDesign.label}
                        width={currentDesign.width}
                        height={currentDesign.height}
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </picture>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {currentDesign.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {project.title} — Variation {selectedIndex + 1} of{" "}
                      {project.designs.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="share-design-url-input"
                    className="text-[11px] font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Direct Link to This Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="share-design-url-input"
                      ref={shareInputRef}
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-100/90 border border-black/[0.08] text-xs text-zinc-700 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20 select-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={15} />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

export type ViewerPlaybackState =
  | "closed"
  | "playing"
  | "transitioning"
  | "showingFirstMockup";

interface ProjectCardItemProps {
  key?: React.Key;
  project: PortfolioProject;
  index: number;
  reducedMotion: boolean;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  onOpenProject: (project: PortfolioProject) => void;
}

function ProjectCardItem({
  project,
  index,
  reducedMotion,
  scrollRootRef,
  onOpenProject,
}: ProjectCardItemProps) {
  return (
    <motion.div
      data-project-slug={project.slug}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        once: true,
        root: scrollRootRef,
        amount: 0.14,
      }}
      transition={{
        duration: 0.5,
        delay: (index % 2) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => preloadProjectDesigns(project, 0)}
      onFocus={() => preloadProjectDesigns(project, 0)}
      onTouchStart={() => preloadProjectDesigns(project, 0)}
      onClick={() => onOpenProject(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProject(project);
        }
      }}
      aria-label={`${project.title} (${project.designs.length} ${
        project.designs.length === 1 ? "Mockup" : "Mockups"
      })`}
      style={{ willChange: "transform, opacity" }}
      className="group glass-card bg-white/70 border border-black/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:bg-white/95 transition-all duration-300 cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
    >
      {/* Preserved Original Static Project Cover Mockup */}
      <div className="relative w-full aspect-[16/10] bg-zinc-50/90 overflow-hidden flex items-center justify-center p-4 sm:p-6">
        <picture className="w-full h-full flex items-center justify-center">
          <source srcSet={project.coverWebp} type="image/webp" />
          <img
            src={encodeURI(project.coverImage)}
            alt={project.title}
            width={project.coverWidth}
            height={project.coverHeight}
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </picture>
      </div>

      <div className="p-6 md:p-7 flex items-center justify-between gap-4 border-t border-black/5 bg-white/60">
        <div className="min-w-0 flex flex-col gap-1.5">
          <h3 className="text-xl md:text-2xl font-medium text-zinc-900 tracking-tight leading-snug">
            {project.title}
          </h3>
          <div className="flex flex-wrap items-center">
            <span className="text-xs text-zinc-500 font-medium tabular-nums">
              {project.designs.length}{" "}
              {project.designs.length === 1 ? "Mockup" : "Mockups"}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-100/80 group-hover:bg-zinc-900 group-hover:text-white text-zinc-600 flex items-center justify-center transition-colors duration-300 shrink-0">
          <Maximize2 size={16} />
        </div>
      </div>
    </motion.div>
  );
}

interface WorkProps {
  key?: React.Key;
}

const COMMERCIAL_TRANSITION_MS = 520;

export function Work(_props: WorkProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sessionCounterRef = useRef<number>(1);
  const transitionTimerRef = useRef<number | null>(null);

  const initialDeepLink = useRef<{
    project: PortfolioProject;
    designIndex: number;
  } | null | undefined>(undefined);

  if (initialDeepLink.current === undefined) {
    if (typeof window === "undefined") {
      initialDeepLink.current = null;
    } else {
      const resolved = resolveDeepLinkFromSearch(window.location.search);
      if (!resolved && window.location.search) {
        clearDeepLinkParamsFromUrl();
      }
      initialDeepLink.current = resolved;
    }
  }

  const [activeSession, setActiveSession] = useState<{
    project: PortfolioProject;
    designIndex: number;
    sessionId: number;
  } | null>(() =>
    initialDeepLink.current
      ? {
          project: initialDeepLink.current.project,
          designIndex: initialDeepLink.current.designIndex,
          sessionId: 1,
        }
      : null
  );

  // Instant Playback State Machine (Zero Loading State):
  // closed -> playing -> transitioning -> showingFirstMockup
  const [playbackState, setPlaybackState] = useState<ViewerPlaybackState>(() => {
    if (!initialDeepLink.current) return "closed";
    return initialDeepLink.current.designIndex > 0
      ? "showingFirstMockup"
      : "playing";
  });

  useEffect(() => {
    warmUpPortfolioAssets();
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  useEffect(() => {
    const onPopState = () => {
      clearTransitionTimer();
      const resolved = resolveDeepLinkFromSearch(window.location.search);
      if (resolved) {
        sessionCounterRef.current += 1;
        setActiveSession({
          project: resolved.project,
          designIndex: resolved.designIndex,
          sessionId: sessionCounterRef.current,
        });
        setPlaybackState(
          resolved.designIndex > 0 ? "showingFirstMockup" : "playing"
        );
      } else {
        if (window.location.search) {
          clearDeepLinkParamsFromUrl();
        }
        sessionCounterRef.current += 1;
        setActiveSession(null);
        setPlaybackState("closed");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [clearTransitionTimer]);

  const openProjectCommercial = useCallback(
    (project: PortfolioProject) => {
      clearTransitionTimer();
      sessionCounterRef.current += 1;
      const nextSessionId = sessionCounterRef.current;

      // Ensure all variations are preloaded while starting 2D playback at 0ms immediately
      preloadProjectDesigns(project, 0);
      setActiveSession({
        project,
        designIndex: 0,
        sessionId: nextSessionId,
      });
      setPlaybackState("playing");
      syncDeepLinkParamsToUrl(project, 0);
    },
    [clearTransitionTimer]
  );

  const handleCommercialComplete = useCallback(
    (sessionId: number) => {
      if (sessionCounterRef.current !== sessionId) return;
      setPlaybackState((prev) => {
        if (
          prev === "transitioning" ||
          prev === "showingFirstMockup" ||
          prev === "closed"
        ) {
          return prev;
        }
        return "transitioning";
      });

      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null;
        if (sessionCounterRef.current !== sessionId) return;
        setPlaybackState("showingFirstMockup");
      }, COMMERCIAL_TRANSITION_MS);
    },
    [clearTransitionTimer]
  );

  const closeProjectViewer = useCallback(() => {
    clearTransitionTimer();
    sessionCounterRef.current += 1;
    setPlaybackState("closed");
    setActiveSession(null);
    clearDeepLinkParamsFromUrl();
  }, [clearTransitionTimer]);

  const isCommercialMounted =
    activeSession !== null &&
    (playbackState === "playing" || playbackState === "transitioning");

  const isMockupViewerMounted =
    activeSession !== null && playbackState !== "closed";

  return (
    <motion.section
      data-viewer-playback-state={playbackState}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 flex flex-col p-4 sm:p-6 md:p-8 lg:p-12 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col py-6 md:py-8 min-h-min pb-24 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ willChange: "transform, opacity" }}
            className="mb-10 md:mb-14"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-900 leading-[1.08] text-balance">
              Thoughts Turned{" "}
              <span className="text-zinc-400 font-light italic">Tangible</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-zinc-500 font-light max-w-2xl leading-relaxed">
              A collection of ideas, experiments and visual stories brought to
              life through branding, packaging and creative exploration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {PROJECTS.map((project, index) => (
              <ProjectCardItem
                key={project.id}
                project={project}
                index={index}
                reducedMotion={prefersReducedMotion}
                scrollRootRef={scrollContainerRef}
                onOpenProject={openProjectCommercial}
              />
            ))}
          </div>
        </div>
      </div>

      {/* First Original Mockup Viewer (Pre-mounted underneath during commercial for seamless zero-flash dissolve) */}
      <AnimatePresence>
        {isMockupViewerMounted && activeSession && (
          <PreviewModal
            key={`preview-${activeSession.project.slug}-${activeSession.sessionId}`}
            project={activeSession.project}
            initialDesignIndex={activeSession.designIndex}
            isSuspended={playbackState !== "showingFirstMockup"}
            onClose={closeProjectViewer}
          />
        )}
      </AnimatePresence>

      {/* Instant 2D Motion-Graphics Commercial Stage (Plays immediately on click, then dissolves into Design 1) */}
      {isCommercialMounted && activeSession && (
        <MotionGraphicsViewerStage
          key={`commercial-2d-${activeSession.project.slug}-${activeSession.sessionId}`}
          project={activeSession.project}
          phase={playbackState}
          reducedMotion={prefersReducedMotion}
          onCommercialComplete={() =>
            handleCommercialComplete(activeSession.sessionId)
          }
          onClose={closeProjectViewer}
        />
      )}
    </motion.section>
  );
}
