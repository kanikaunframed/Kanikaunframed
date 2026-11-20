import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";
import gsap from "gsap";
import {
  classifyMockupFormat,
  createCurvedLedBillboardRenderer,
  type CurvedLedBillboardRenderer,
  LED_CANVAS_PIXEL_H,
  LED_CANVAS_PIXEL_W,
  LED_FOREIGN_OBJECT_H,
  LED_FOREIGN_OBJECT_W,
  LED_FOREIGN_OBJECT_X,
  LED_FOREIGN_OBJECT_Y,
  type MockupFormatCategory,
} from "../utils/curvedLedBillboardRenderer";
import { MY_WORK_PROJECTS } from "./Work";

/**
 * Exact 10 original supplied architectural image assets in `/public`.
 * - Frame 1.png: Initial architectural blueprint (1312 x 1199)
 * - Frame 2.png: Completed main office blueprint (1536 x 1024, strictly cropped & silhouette-masked)
 * - Frame 3.png: Black architectural structural outline (1536 x 1024)
 * - Frame 4.png: Curved glass facade installation (1536 x 1024)
 * - Frame 5.png: Curved charcoal roof construction (1536 x 1024)
 * - Frame 6.png: Exterior recessed spotlights & warm amber LED perimeter (1535 x 1024)
 * - Frame 7.png: Upper-floor studio illumination (1535 x 1024)
 * - Frame 8.png: Ground-floor studio & staircase illumination (1535 x 1024)
 * - Frame 9.png: Brand reveal storyboard reference ONLY (preloaded, NEVER rendered in DOM)
 * - Frame 10.png: Final completed Kanika Unframed office (1535 x 1024)
 */
export const OFFICE_CONSTRUCTION_FRAMES = {
  frame1: "/Frame%201.png",
  frame2: "/Frame%202.png",
  frame3: "/Frame%203.png",
  frame4: "/Frame%204.png",
  frame5: "/Frame%205.png",
  frame6: "/Frame%206.png",
  frame7: "/Frame%207.png",
  frame8: "/Frame%208.png",
  frame9ReferenceOnly: "/Frame%209.png",
  frame10: "/Frame%2010.png",
} as const;

interface BillboardProjectAsset {
  readonly id: string;
  readonly designSlug: string;
  readonly label: string;
  readonly src: string;
  readonly encodedSrc: string;
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
  readonly format: MockupFormatCategory;
}

/**
 * Complete collection of all 17 original portfolio mockups sourced EXCLUSIVELY from
 * `MY_WORK_PROJECTS` (`Work.tsx`), interleaved round-robin across projects so adjacent panels
 * on the curved panoramic LED billboard always contrast cleanly while cycling through every
 * available My Work mockup.
 */
function buildAllMyWorkBillboardProjects(): readonly BillboardProjectAsset[] {
  const maxDesigns = MY_WORK_PROJECTS.reduce(
    (max, project) => Math.max(max, project.designs.length),
    0
  );
  const items: BillboardProjectAsset[] = [];
  for (let round = 0; round < maxDesigns; round++) {
    for (const project of MY_WORK_PROJECTS) {
      const design = project.designs[round];
      if (!design) continue;
      items.push({
        id: project.slug,
        designSlug: design.slug,
        label: project.title,
        src: design.src,
        encodedSrc: encodeURI(design.src),
        width: design.width,
        height: design.height,
        aspectRatio: design.width / design.height,
        format: classifyMockupFormat(design.width, design.height),
      });
    }
  }
  return items;
}

const BILLBOARD_PROJECTS: readonly BillboardProjectAsset[] =
  buildAllMyWorkBillboardProjects();

const BILLBOARD_ASSET_URLS: readonly string[] = BILLBOARD_PROJECTS.map(
  (project) => project.encodedSrc
);

/**
 * Sub-pixel verified inner recessed LED screen silhouette inside Frame 10's curved upper crown
 * (`x = 332 .. 1270` in `1535 x 1024` master space).
 * Leaves the outer sculpted top rim, left/right vertical bezels, and brushed-metal canopy ridge untouched.
 */
const CURVED_BILLBOARD_LED_SCREEN_PATH =
  "M 332 240 L 332 146 C 338.3 140.3, 355.3 122.8, 370 112 C 384.7 101.2, 401.7 90.3, 420 81 C 438.3 71.7, 458.3 63.7, 480 56 C 501.7 48.3, 525.8 40.8, 550 35 C 574.2 29.2, 600.0 24.3, 625 21 C 650.0 17.7, 675.0 16.2, 700 15 C 725.0 13.8, 750.0 13.5, 775 14 C 800.0 14.5, 825.0 15.7, 850 18 C 875.0 20.3, 900.0 23.5, 925 28 C 950.0 32.5, 975.0 38.2, 1000 45 C 1025.0 51.8, 1050.8 59.5, 1075 69 C 1099.2 78.5, 1122.5 89.7, 1145 102 C 1167.5 114.3, 1192.5 130.3, 1210 143 C 1227.5 155.7, 1240.0 168.3, 1250 178 C 1260.0 187.7, 1266.7 197.2, 1270 201 L 1270 349 C 1266.7 347.2, 1260.0 343.5, 1250 338 C 1240.0 332.5, 1227.5 324.5, 1210 316 C 1192.5 307.5, 1167.5 296.2, 1145 287 C 1122.5 277.8, 1099.2 269.0, 1075 261 C 1050.8 253.0, 1025.0 245.3, 1000 239 C 975.0 232.7, 950.0 227.7, 925 223 C 900.0 218.3, 875.0 214.3, 850 211 C 825.0 207.7, 800.0 204.8, 775 203 C 750.0 201.2, 725.0 200.5, 700 200 C 675.0 199.5, 650.0 199.5, 625 200 C 600.0 200.5, 574.2 201.3, 550 203 C 525.8 204.7, 501.7 207.3, 480 210 C 458.3 212.7, 438.3 215.7, 420 219 C 401.7 222.3, 384.7 226.5, 370 230 C 355.3 233.5, 338.3 238.3, 332 240 Z";

const BILLBOARD_ROTATION_PERIOD_SECONDS = 3.0;
const BILLBOARD_AUTO_SLIDE_SECONDS = 0.85;
const BILLBOARD_HOLD_SECONDS =
  BILLBOARD_ROTATION_PERIOD_SECONDS - BILLBOARD_AUTO_SLIDE_SECONDS; // 2.15s hold + 0.85s rightward glide = 3.00s exact cycle
const BILLBOARD_POWER_ON_SECONDS = 0.68;
const BILLBOARD_MANUAL_SLIDE_SECONDS = 0.78;
const BILLBOARD_MANUAL_PAUSE_SECONDS = 6.0;

const SVG_VIEWBOX_MIN_X = -16;
const SVG_VIEWBOX_MIN_Y = -18;
const SVG_VIEWBOX_WIDTH = 1568;
const SVG_VIEWBOX_HEIGHT = 1048;

/**
 * Exact architectural sliding-door portal geometry in `Frame 10.png` (1535 x 1024 master space):
 * - Stationary entrance frame & pocket jambs: left `x = 614..633`, right `x = 780..795`
 * - Overhead automatic sliding track: `y = 600..608`; Floor threshold track: `y = 948..957`
 * - Clear doorway opening: `x = 633..780` (`width = 147`), `y = 608..948` (`height = 340`)
 * - Centre meeting point: `x = 693`
 *   - Left Sliding Glass Door: `x = 633..693` (`width = 60`), slides left `-26` (~43.3% of width)
 *   - Right Sliding Glass Door: `x = 693..780` (`width = 87`), slides right `+37` (~42.5% of width)
 */
const DOOR_PORTAL_X = 633;
const DOOR_PORTAL_Y = 608;
const DOOR_PORTAL_W = 147;
const DOOR_PORTAL_H = 340;
const DOOR_MEETING_SEAM_X = 693;
const LEFT_DOOR_W = DOOR_MEETING_SEAM_X - DOOR_PORTAL_X; // 60
const RIGHT_DOOR_W = DOOR_PORTAL_X + DOOR_PORTAL_W - DOOR_MEETING_SEAM_X; // 87

const LEFT_DOOR_OPEN_DX = -27;
const RIGHT_DOOR_OPEN_DX = 37;

const DOOR_OPEN_SECONDS = 0.48;
const DOOR_HOLD_OPEN_SECONDS = 0.24;
const DOOR_CLOSE_SECONDS = 0.54;

const SLIDING_DOOR_ASSETS = {
  cleanDoorway: "/extracted/office-doorway-clean.png",
  leftDoor: "/extracted/office-door-left.png",
  rightDoor: "/extracted/office-door-right.png",
} as const;

const SLIDING_DOOR_ASSET_URLS: readonly string[] = [
  SLIDING_DOOR_ASSETS.cleanDoorway,
  SLIDING_DOOR_ASSETS.leftDoor,
  SLIDING_DOOR_ASSETS.rightDoor,
];

/**
 * Exact solver for Apple-inspired fluid architectural motion curve `cubic-bezier(0.22, 1, 0.36, 1)`.
 */
function createCubicBezierEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (p: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (p: number): number => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const err = sampleCurveX(t) - p;
      if (Math.abs(err) < 1e-6) break;
      const d = sampleDerivX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    t = Math.max(0, Math.min(1, t));
    return sampleCurveY(t);
  };
}

const DOOR_ARCHITECTURAL_EASE = createCubicBezierEase(0.22, 1, 0.36, 1);

function formatBillboardLineup(continuousIdx: number): string {
  const n = BILLBOARD_PROJECTS.length;
  if (n === 0) return "";
  const base = ((Math.round(continuousIdx) % n) + n) % n;
  const visibleCount = Math.min(4, n);
  const ordered: string[] = [];
  for (let offset = 0; offset < visibleCount; offset++) {
    const item = BILLBOARD_PROJECTS[(base - offset + n * 4) % n];
    ordered.push(`${item.designSlug} (${item.format})`);
  }
  return ordered.join(" | ");
}

const REMAINING_FRAME_URLS: readonly string[] = [
  OFFICE_CONSTRUCTION_FRAMES.frame2,
  OFFICE_CONSTRUCTION_FRAMES.frame3,
  OFFICE_CONSTRUCTION_FRAMES.frame4,
  OFFICE_CONSTRUCTION_FRAMES.frame5,
  OFFICE_CONSTRUCTION_FRAMES.frame6,
  OFFICE_CONSTRUCTION_FRAMES.frame7,
  OFFICE_CONSTRUCTION_FRAMES.frame8,
  OFFICE_CONSTRUCTION_FRAMES.frame9ReferenceOnly,
  OFFICE_CONSTRUCTION_FRAMES.frame10,
  ...BILLBOARD_ASSET_URLS,
  ...SLIDING_DOOR_ASSET_URLS,
];

const preloadedFrameCache = new Map<string, HTMLImageElement>();
let allFramesReadyFlag = false;
let preloadPromise: Promise<void> | null = null;

function preloadSingleFrame(
  url: string,
  priority: "high" | "auto" = "auto"
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (preloadedFrameCache.has(url)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    if (priority === "high" && "fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        "high";
    }
    const done = () => {
      preloadedFrameCache.set(url, img);
      resolve();
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

export function preloadOfficeHeroAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (allFramesReadyFlag) return Promise.resolve();
  if (preloadPromise) return preloadPromise;

  const p1 = preloadSingleFrame(OFFICE_CONSTRUCTION_FRAMES.frame1, "high");
  const pRest = Promise.all(
    REMAINING_FRAME_URLS.map((url) => preloadSingleFrame(url, "auto"))
  );

  preloadPromise = Promise.all([p1, pRest]).then(() => {
    allFramesReadyFlag = true;
  });
  return preloadPromise;
}

/**
 * Session-level persistence:
 * Autoplays once on initial Home tab experience. Switching to About Me / My Work / Contact Me
 * and returning to Home keeps the finished Frame 10 office displayed unless Replay is clicked.
 */
let hasCompletedOfficeConstructionOnce = false;

/**
 * Dedicated Frame 1 Architectural Silhouette Path (1535x1024 master space):
 * - Preserves 100% of Frame 1's actual curved crown, canopy tips, outer walls & curved foundation slab
 * - Cleanly excludes all peripheral blueprint dimension arrows, leader callouts & crosshair ticks
 */
const F1_ARCHITECTURAL_SILHOUETTE_PATH = [
  "M 305 254",
  "L 305 138",
  "C 376 74, 534 2, 724 2",
  "C 934 2, 1164 94, 1345 226",
  "L 1345 396",
  "C 1378 418, 1401 438, 1401 454",
  "C 1401 472, 1376 482, 1349 488",
  "L 1349 892",
  "C 1140 942, 860 960, 560 958",
  "C 360 956, 260 932, 212 892",
  "L 212 478",
  "C 154 434, 116 392, 116 350",
  "C 116 294, 206 266, 305 254",
  "Z",
].join(" ");

/**
 * Master Architectural Outer Silhouette Path in 1535x1024 space (Frames 2-8, traced from Frame 10.png):
 * - Suppresses peripheral drafting dimension bars in Frame 2.
 * - Clips away the detached leaning glass sheets protruding outside the left & right walls in Frames 4-8.
 */
const MASTER_BUILDING_SILHOUETTE_PATH = [
  "M 317 256",
  "L 317 154",
  "C 366 78, 534 3, 742 3",
  "C 954 3, 1164 78, 1286 190",
  "L 1286 355",
  "C 1344 384, 1392 420, 1392 456",
  "C 1392 486, 1364 508, 1332 520",
  "L 1332 926",
  "L 1408 954",
  "L 1408 1006",
  "L 128 1006",
  "L 128 954",
  "L 188 926",
  "L 188 486",
  "C 144 456, 118 418, 118 380",
  "C 118 326, 206 282, 317 256",
  "Z",
].join(" ");

/**
 * Exact Outer Silhouette of Surface A — Upper Curved Matte-Black Billboard (1535x1024 space).
 */
const CURVED_UPPER_BILLBOARD_PATH = [
  "M 318 258",
  "L 318 156",
  "C 368 80, 535 4, 742 4",
  "C 952 4, 1162 80, 1285 192",
  "L 1285 366",
  "C 1175 304, 1020 246, 845 215",
  "C 710 198, 560 204, 430 228",
  "C 382 238, 346 248, 318 258",
  "Z",
].join(" ");

/**
 * Curved Glass Facade Zone strictly BELOW the canopy soffit (Stage 4)
 */
const CURVED_FACADE_BELOW_CANOPY_PATH = [
  "M 188 484",
  "C 340 338, 560 306, 760 310",
  "C 985 314, 1195 368, 1332 518",
  "L 1332 986",
  "L 188 986",
  "Z",
].join(" ");

/**
 * Exact Curved Inner Bezel Path of Surface B — Central Facade Signage (1535x1024 space).
 */
const CENTRAL_SIGN_INNER_BEZEL_PATH = [
  "M 516 430",
  "C 592 420, 746 421, 885 441",
  "L 885 602",
  "C 746 594, 592 594, 516 598",
  "Z",
].join(" ");

/**
 * Clean Rightmost Structural Glass Bay Path (x=1228..1332, aligned on solid black mullions).
 */
const CLEAN_RIGHT_BAY_PATH = [
  "M 1228 430",
  "L 1332 514",
  "L 1332 936",
  "L 1228 948",
  "Z",
].join(" ");

/**
 * Stage 5 Continuous Curved Canopy ClipPath (full arch, zero vertical cut seams).
 */
const STAGE_5_CLEAN_CANOPY_PATH = [
  "M 116 380",
  "C 116 324, 206 280, 317 254",
  "L 317 152",
  "C 368 76, 535 3, 742 3",
  "C 954 3, 1164 76, 1286 190",
  "L 1286 355",
  "C 1344 384, 1392 420, 1392 456",
  "C 1392 486, 1364 508, 1332 520",
  "C 1195 368, 985 314, 760 310",
  "C 560 306, 340 338, 188 486",
  "C 144 456, 116 418, 116 380",
  "Z",
].join(" ");

/**
 * Sequential Stroke-by-Stroke Opening Architectural Pen Drawing (0.80s - 3.16s).
 * Every single path is a continuous single subpath pixel-traced directly from `/public/Frame 1.png`
 * in exact architectural order:
 *   1. Primary architectural crown structure (0.80 - 1.23s)
 *   2. Main building outer boundaries & curved foundation plinth (1.27 - 1.68s)
 *   3. Distinctive overhanging curved roof & inner soffit arch (1.705 - 2.18s)
 *   4. Vertical facade structural mullions (2.22 - 2.695s)
 *   5. Main curved glass facade transom outline (2.73 - 2.90s)
 *   6. Central entrance doorway & interior staircase structural stringer (2.94 - 3.16s)
 *   7. Remaining original Frame 1 architectural blueprint details (3.15 - 3.50s)
 */
interface OpeningPenStroke {
  id: string;
  d: string;
  strokeWidth: number;
  drawStart: number;
  drawEnd: number;
}

const PEN_INITIAL_ANCHOR: readonly [number, number] = [308, 250];
const BLUEPRINT_INK_COLOR = "#0A26AD";

const OPENING_PEN_STROKES: readonly OpeningPenStroke[] = [
  // 1. Primary Architectural Structure — Upper Curved Crown
  {
    id: "crown-left-post",
    d: "M 308 250 L 308 140",
    strokeWidth: 2.35,
    drawStart: 0.8,
    drawEnd: 0.89,
  },
  {
    id: "crown-top-arch",
    d: "M 308 140 C 378 76, 536 4, 723 3.5 C 932 3.5, 1162 96, 1342 228",
    strokeWidth: 2.45,
    drawStart: 0.92,
    drawEnd: 1.13,
  },
  {
    id: "crown-right-post",
    d: "M 1342 228 L 1342 396",
    strokeWidth: 2.25,
    drawStart: 1.155,
    drawEnd: 1.23,
  },

  // 2. Main Building Boundaries — Outer Walls & Curved Foundation Plinth
  {
    id: "right-outer-wall",
    d: "M 1346 484 L 1346 886",
    strokeWidth: 2.35,
    drawStart: 1.27,
    drawEnd: 1.37,
  },
  {
    id: "curved-ground-plinth",
    d: "M 1346 886 C 1140 936, 860 956, 560 954 C 365 952, 265 928, 215 888",
    strokeWidth: 2.45,
    drawStart: 1.4,
    drawEnd: 1.57,
  },
  {
    id: "left-outer-wall",
    d: "M 215 888 L 215 477",
    strokeWidth: 2.35,
    drawStart: 1.595,
    drawEnd: 1.68,
  },

  // 3. Distinctive Curved Roof / Canopy Outline
  {
    id: "canopy-outer-arch",
    d: "M 215 477 C 160 434, 120 390, 119 350 C 128 294, 318 232, 565 229 C 865 229, 1215 312, 1396.5 450.5 C 1394 468, 1372 478, 1346 484",
    strokeWidth: 2.5,
    drawStart: 1.705,
    drawEnd: 1.98,
  },
  {
    id: "canopy-inner-soffit-arch",
    d: "M 1346 484 C 1180 436, 960 364, 740 340 C 535 322, 365 348, 326 381 C 292 408, 274 445, 268 487",
    strokeWidth: 2.15,
    drawStart: 2.005,
    drawEnd: 2.18,
  },

  // 4. Vertical Facade Structures — Sequential Architectural Mullions
  {
    id: "mullion-left-primary",
    d: "M 326 381 L 326 921",
    strokeWidth: 2.1,
    drawStart: 2.22,
    drawEnd: 2.295,
  },
  {
    id: "mullion-sign-left",
    d: "M 394.5 897 L 394.5 357.5",
    strokeWidth: 2.1,
    drawStart: 2.325,
    drawEnd: 2.4,
  },
  {
    id: "mullion-sign-right",
    d: "M 890.4 360.3 L 890.4 930",
    strokeWidth: 2.1,
    drawStart: 2.44,
    drawEnd: 2.515,
  },
  {
    id: "mullion-right-mid",
    d: "M 990.6 916 L 990.6 382.4",
    strokeWidth: 2.0,
    drawStart: 2.545,
    drawEnd: 2.61,
  },
  {
    id: "mullion-right-outer",
    d: "M 1148.9 426.5 L 1148.9 908.4",
    strokeWidth: 1.95,
    drawStart: 2.635,
    drawEnd: 2.695,
  },

  // 5. Main Glass Facade Outlines — Curved Mid-Level Transom
  {
    id: "curved-glass-transom",
    d: "M 1345 658 C 1170 646, 965 616, 775 595 C 595 582, 415 585, 268 598",
    strokeWidth: 2.25,
    drawStart: 2.73,
    drawEnd: 2.9,
  },

  // 6. Entrance & Lower Structural Boundaries — Central Doorframe & Staircase Stringer
  {
    id: "entrance-doorframe",
    d: "M 624.5 934 L 624.5 586 L 786 594 L 786 932",
    strokeWidth: 2.05,
    drawStart: 2.94,
    drawEnd: 3.055,
  },
  {
    id: "staircase-stringer",
    d: "M 446 892 L 775 622",
    strokeWidth: 2.0,
    drawStart: 3.085,
    drawEnd: 3.16,
  },
];

/**
 * Step 7 Finishing Pen Sweep & Curved Architectural Detail Mask Paths (3.15s - 3.50s):
 * Progressively reveals Frame 1's diagonal roof blueprint hatching, soffit radial ribs & recessed ovals,
 * fluted column ribs, staircase treads, studio desks, bookshelves & trees — zero rectangle wipes!
 */
const STAGE_1_DETAIL_PEN_SWEEP_PATH =
  "M 775 622 C 742 475, 678 308, 618 246 C 788 250, 985 312, 1138 426";

const F1_DETAIL_CROWN_MASK_PATH =
  "M 105 352 C 350 185, 560 155, 745 155 C 955 155, 1185 225, 1405 450";
const F1_DETAIL_UPPER_MASK_PATH =
  "M 195 495 C 495 445, 920 455, 1360 525";
const F1_DETAIL_GROUND_MASK_PATH =
  "M 195 795 C 520 815, 940 815, 1360 785";

/**
 * Stage 3 Marker Tool Guide Path (1535x1024 space)
 */
const STAGE_3_MARKER_TRACE_PATH = [
  "M 320 162",
  "C 420 52, 585 8, 745 8",
  "C 945 8, 1148 78, 1282 194",
  "L 1378 450",
  "C 1145 275, 895 212, 685 210",
  "C 445 208, 255 268, 132 378",
  "L 222 488",
  "L 222 928",
  "C 540 960, 960 960, 1322 925",
  "L 1090 638",
  "L 518 615",
  "L 428 885",
].join(" ");

/**
 * 8 vertical structural glass bays strictly inside the curved facade below the canopy (Stage 4)
 */
const GLASS_FACADE_BAYS: readonly { x: number; w: number; order: number }[] = [
  { x: 186, w: 142, order: 3 },
  { x: 324, w: 158, order: 2 },
  { x: 478, w: 150, order: 1 },
  { x: 624, w: 166, order: 0 },
  { x: 786, w: 154, order: 0 },
  { x: 936, w: 158, order: 1 },
  { x: 1090, w: 142, order: 2 },
  { x: 1228, w: 108, order: 3 },
];

/**
 * Stage 9A subtle golden stroke-leading waypoints along Frame 10's exact KU symbol
 */
const KU_GOLD_TRACE_WAYPOINTS: readonly [number, number][] = [
  [636, 436],
  [636, 502],
  [676, 438],
  [644, 470],
  [688, 506],
  [686, 468],
  [690, 526],
  [722, 536],
  [748, 512],
  [748, 466],
];

const CURSOR_BASE_SCALE = 1.16;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep01(v: number): number {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

function cosineEaseInOut01(v: number): number {
  const t = clamp01(v);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function samplePolyline(
  pts: readonly [number, number][],
  tRaw: number
): [number, number] {
  const t = clamp01(tRaw);
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1) return pts[0];
  const scaled = t * (pts.length - 1);
  const idx = Math.min(pts.length - 2, Math.floor(scaled));
  const frac = scaled - idx;
  const smooth = frac * frac * (3 - 2 * frac);
  const [x0, y0] = pts[idx];
  const [x1, y1] = pts[idx + 1];
  return [x0 + (x1 - x0) * smooth, y0 + (y1 - y0) * smooth];
}

interface OfficeHeroShowcaseProps {
  isIntroActive?: boolean;
}

export const OfficeHeroShowcase: React.FC<OfficeHeroShowcaseProps> = ({
  isIntroActive = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  const showFinalOnMount =
    Boolean(prefersReducedMotion) || hasCompletedOfficeConstructionOnce;

  const [allAssetsReady, setAllAssetsReady] = useState<boolean>(
    () => allFramesReadyFlag
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(() => !showFinalOnMount);
  const [doorControlsInteractive, setDoorControlsInteractive] =
    useState<boolean>(() => showFinalOnMount);
  const [hoveredDoor, setHoveredDoor] = useState<"left" | "right" | null>(null);
  const [focusedDoor, setFocusedDoor] = useState<"left" | "right" | null>(null);
  const [svgMetrics, setSvgMetrics] = useState<{
    originX: number;
    originY: number;
    scale: number;
    wrapWidth: number;
    wrapHeight: number;
  } | null>(null);
  const [introCurtainCleared, setIntroCurtainCleared] = useState<boolean>(
    () => !isIntroActive
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const carouselCtrlRef = useRef<{
    active: boolean;
    currentIndex: number;
    targetIndex: number;
    powerLevel: number;
    entryLevel: number;
    isManualTransition: boolean;
    isAutoplayPaused: boolean;
    pendingManualDirection: -1 | 1 | null;
    powerTween: gsap.core.Tween | null;
    tween: gsap.core.Tween | null;
    autoTimer: gsap.core.Tween | null;
  }>({
    active: false,
    currentIndex: 0,
    targetIndex: 0,
    powerLevel: showFinalOnMount ? 1 : 0,
    entryLevel: showFinalOnMount ? 1 : 0,
    isManualTransition: false,
    isAutoplayPaused: false,
    pendingManualDirection: null,
    powerTween: null,
    tween: null,
    autoTimer: null,
  });
  const startedThisMountRef = useRef<boolean>(false);

  // Wait for LandingHero's 720ms exit curtain wipe to finish before starting the 0.4s empty-white hold
  useEffect(() => {
    if (isIntroActive) {
      setIntroCurtainCleared(false);
      return;
    }
    if (introCurtainCleared) return;
    const delayMs = prefersReducedMotion ? 220 : 770;
    const timer = window.setTimeout(() => {
      setIntroCurtainCleared(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [isIntroActive, introCurtainCleared, prefersReducedMotion]);

  // Opening Phase (0.00 - 3.80s): Empty White Canvas -> Pen Tool -> Sequential Strokes -> Frame 1 Details
  const openingStrokesGroupRef = useRef<SVGGElement | null>(null);
  const openingStrokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const detailPenSweepPathRef = useRef<SVGPathElement | null>(null);
  const penCursorRef = useRef<SVGGElement | null>(null);

  const f1GroupRef = useRef<SVGGElement | null>(null);
  const f1DetailCrownMaskRef = useRef<SVGPathElement | null>(null);
  const f1DetailUpperMaskRef = useRef<SVGPathElement | null>(null);
  const f1DetailGroundMaskRef = useRef<SVGPathElement | null>(null);
  const f1EraseStop1Ref = useRef<SVGStopElement | null>(null);
  const f1EraseStop2Ref = useRef<SVGStopElement | null>(null);

  // Stage 2: Frame 2 (strictly cropped & silhouette-masked, with inverse erase against Stage 3)
  const f2GroupRef = useRef<SVGGElement | null>(null);
  const f2RevealStop1Ref = useRef<SVGStopElement | null>(null);
  const f2RevealStop2Ref = useRef<SVGStopElement | null>(null);
  const f2InverseStop1Ref = useRef<SVGStopElement | null>(null);
  const f2InverseStop2Ref = useRef<SVGStopElement | null>(null);

  // Stage 3: Frame 3 + synchronized Marker Tool
  const f3GroupRef = useRef<SVGGElement | null>(null);
  const f3RevealStop1Ref = useRef<SVGStopElement | null>(null);
  const f3RevealStop2Ref = useRef<SVGStopElement | null>(null);
  const markerGuidePathRef = useRef<SVGPathElement | null>(null);
  const markerCursorRef = useRef<SVGGElement | null>(null);

  // Stage 4 & 5: Frame 4 Glass Bays (below canopy) + Curved Matte-Black Billboard + Clean Charcoal Canopy
  const f4GroupRef = useRef<SVGGElement | null>(null);
  const f4BayRectRefs = useRef<(SVGRectElement | null)[]>([]);
  const f4CanopySoffitRef = useRef<SVGGElement | null>(null);

  const f5GroupRef = useRef<SVGGElement | null>(null);
  const f5CanopyStop1Ref = useRef<SVGStopElement | null>(null);
  const f5CanopyStop2Ref = useRef<SVGStopElement | null>(null);

  // Surface A: Curved Matte-Black Upper Billboard
  const curvedBillboardGroupRef = useRef<SVGGElement | null>(null);
  const bbArcStop1Ref = useRef<SVGStopElement | null>(null);
  const bbArcStop2Ref = useRef<SVGStopElement | null>(null);

  // Clean Left Fluted Column & Clean Right Glass Bay Repairs for Stages 4-8
  const cleanLeftColumnGroupRef = useRef<SVGGElement | null>(null);
  const cleanRightBayCoolGroupRef = useRef<SVGGElement | null>(null);
  const cleanRightBayUpperGroupRef = useRef<SVGGElement | null>(null);

  // Stage 6: Frame 6 Exterior Recessed Spotlights & Warm Amber LED Perimeter
  const f6GroupRef = useRef<SVGGElement | null>(null);
  const f6LedStop1Ref = useRef<SVGStopElement | null>(null);
  const f6LedStop2Ref = useRef<SVGStopElement | null>(null);
  const f6WarmBloomRef = useRef<SVGEllipseElement | null>(null);

  // Stage 7: Frame 7 Upper-Floor Studio Illumination
  const f7GroupRef = useRef<SVGGElement | null>(null);
  const f7UpperStop1Ref = useRef<SVGStopElement | null>(null);
  const f7UpperStop2Ref = useRef<SVGStopElement | null>(null);

  // Stage 8: Frame 8 Ground-Floor Studio Illumination
  const f8GroupRef = useRef<SVGGElement | null>(null);
  const f8GroundStop1Ref = useRef<SVGStopElement | null>(null);
  const f8GroundStop2Ref = useRef<SVGStopElement | null>(null);

  // Unbranded Central Signage Backing across Stages 4-8 + Stage 9A/9B Authentic Frame 10 Brand Reveal
  const signPatchCoolRef = useRef<SVGRectElement | null>(null);
  const signPatchMidRef = useRef<SVGRectElement | null>(null);
  const signPatchWarmRef = useRef<SVGRectElement | null>(null);
  const signPatchBacklitF10Ref = useRef<SVGRectElement | null>(null);

  const stage9BrandGroupRef = useRef<SVGGElement | null>(null);
  const s9KuGroupRef = useRef<SVGGElement | null>(null);
  const s9KuStop1Ref = useRef<SVGStopElement | null>(null);
  const s9KuStop2Ref = useRef<SVGStopElement | null>(null);
  const s9WordmarkGroupRef = useRef<SVGGElement | null>(null);
  const s9WordmarkStop1Ref = useRef<SVGStopElement | null>(null);
  const s9WordmarkStop2Ref = useRef<SVGStopElement | null>(null);
  const goldSparkGroupRef = useRef<SVGGElement | null>(null);

  // Stage 10: Final Completed Office (Frame 10.png) + subtle ground shadow + 3D Cylindrical Curved LED Billboard + Glass Door Controls
  const f10GroupRef = useRef<SVGGElement | null>(null);
  const groundShadowRef = useRef<SVGEllipseElement | null>(null);
  const billboardRootRef = useRef<HTMLDivElement | null>(null);
  const ledCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ledRendererRef = useRef<CurvedLedBillboardRenderer | null>(null);
  const renderedDeviceScaleRef = useRef<number>(1.0);
  const lastBillboardRenderArgsRef = useRef<{
    idx: number;
    power: number;
    entry: number;
  }>({ idx: 0, power: showFinalOnMount ? 1 : 0, entry: showFinalOnMount ? 1 : 0 });

  // Physical Sliding Glass Entrance Doors & Apple Liquid-Glass Reflection Refs
  const slidingDoorsSystemGroupRef = useRef<SVGGElement | null>(null);
  const leftSlidingDoorGroupRef = useRef<SVGGElement | null>(null);
  const rightSlidingDoorGroupRef = useRef<SVGGElement | null>(null);
  const leftOpenApertureGlowRef = useRef<SVGRectElement | null>(null);
  const rightOpenApertureGlowRef = useRef<SVGRectElement | null>(null);
  const leftDoorBloomRef = useRef<SVGRectElement | null>(null);
  const rightDoorBloomRef = useRef<SVGRectElement | null>(null);
  const leftDoorSheenRef = useRef<SVGRectElement | null>(null);
  const rightDoorSheenRef = useRef<SVGRectElement | null>(null);
  const leftOpenEdgeShadowRef = useRef<SVGRectElement | null>(null);
  const rightOpenEdgeShadowRef = useRef<SVGRectElement | null>(null);

  const doorAnimStateRef = useRef<{
    leftDx: number;
    rightDx: number;
    leftSheenX: number;
    rightSheenX: number;
    leftSheenOp: number;
    rightSheenOp: number;
    leftBloomOp: number;
    rightBloomOp: number;
    leftTl: gsap.core.Timeline | null;
    rightTl: gsap.core.Timeline | null;
  }>({
    leftDx: 0,
    rightDx: 0,
    leftSheenX: -36,
    rightSheenX: -36,
    leftSheenOp: 0,
    rightSheenOp: 0,
    leftBloomOp: 0,
    rightBloomOp: 0,
    leftTl: null,
    rightTl: null,
  });

  // Track exact rendered SVG viewBox metrics so percentage-based invisible door hit areas stay sub-pixel locked
  useLayoutEffect(() => {
    const wrapperEl = svgWrapperRef.current;
    const svgEl = svgRef.current;
    if (!wrapperEl || !svgEl) return;

    const updateMetrics = () => {
      const wrapRect = wrapperEl.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();
      if (
        svgRect.width <= 0 ||
        svgRect.height <= 0 ||
        wrapRect.width <= 0 ||
        wrapRect.height <= 0
      ) {
        return;
      }

      const scale = Math.min(
        svgRect.width / SVG_VIEWBOX_WIDTH,
        svgRect.height / SVG_VIEWBOX_HEIGHT
      );
      const originX =
        svgRect.left -
        wrapRect.left +
        (svgRect.width - SVG_VIEWBOX_WIDTH * scale) * 0.5;
      const originY =
        svgRect.top -
        wrapRect.top +
        (svgRect.height - SVG_VIEWBOX_HEIGHT * scale) * 0.5;

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      renderedDeviceScaleRef.current = scale * dpr;
      if (ledRendererRef.current && lastBillboardRenderArgsRef.current.power > 0.002) {
        const prev = lastBillboardRenderArgsRef.current;
        ledRendererRef.current.render(
          prev.idx,
          prev.power,
          prev.entry,
          renderedDeviceScaleRef.current
        );
      }

      setSvgMetrics((prev) => {
        if (
          prev &&
          Math.abs(prev.originX - originX) < 0.25 &&
          Math.abs(prev.originY - originY) < 0.25 &&
          Math.abs(prev.scale - scale) < 0.0005 &&
          Math.abs(prev.wrapWidth - wrapRect.width) < 0.5 &&
          Math.abs(prev.wrapHeight - wrapRect.height) < 0.5
        ) {
          return prev;
        }
        return {
          originX,
          originY,
          scale,
          wrapWidth: wrapRect.width,
          wrapHeight: wrapRect.height,
        };
      });
    };

    updateMetrics();
    const ro = new ResizeObserver(updateMetrics);
    ro.observe(wrapperEl);
    ro.observe(svgEl);
    window.addEventListener("resize", updateMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  // Initialize GPU 3D Cylindrical Curved LED Billboard Renderer & stream all 5 full-bleed commercial panels
  useLayoutEffect(() => {
    const canvasEl = ledCanvasRef.current;
    if (!canvasEl) return;

    const renderer = createCurvedLedBillboardRenderer(canvasEl);
    ledRendererRef.current = renderer;

    let disposed = false;

    const uploadAvailablePanels = () => {
      if (disposed) return;
      const imgs: HTMLImageElement[] = [];
      for (let i = 0; i < BILLBOARD_PROJECTS.length; i++) {
        const cached = preloadedFrameCache.get(BILLBOARD_PROJECTS[i].encodedSrc);
        if (cached) {
          imgs.push(cached);
        }
      }
      if (imgs.length === BILLBOARD_PROJECTS.length) {
        renderer.setPanelImages(imgs);
        const cur = lastBillboardRenderArgsRef.current;
        renderer.render(
          cur.idx,
          cur.power,
          cur.entry,
          renderedDeviceScaleRef.current
        );
      }
    };

    uploadAvailablePanels();

    void Promise.all(
      BILLBOARD_PROJECTS.map((p) => preloadSingleFrame(p.encodedSrc, "high"))
    ).then(() => {
      uploadAvailablePanels();
    });

    const cur = lastBillboardRenderArgsRef.current;
    renderer.render(
      cur.idx,
      cur.power,
      cur.entry,
      renderedDeviceScaleRef.current
    );

    return () => {
      disposed = true;
      ledRendererRef.current = null;
      renderer.dispose();
    };
  }, []);

  // Preload Frame 1 immediately at high priority, followed by Frames 2-10 and all 5 project mockups
  useEffect(() => {
    let cancelled = false;
    void preloadSingleFrame(OFFICE_CONSTRUCTION_FRAMES.frame1, "high");
    void preloadOfficeHeroAssets().then(() => {
      if (!cancelled) {
        setAllAssetsReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Drives the photorealistic 3D cylindrical curved LED panoramic display inside the upper black crown:
   * - Wraps 3 simultaneous full-bleed commercial ads (`ZAMBARA | REVA | RAYMOND` at index 0) seamlessly
   *   edge-to-edge across the curved cylindrical screen with zero white cards, frames, or gaps.
   * - Keeps physical SMD LED hardware diodes (`288 x 54`) stationary on the curved architecture while
   *   advertisements wrap smoothly around the cylinder in response to autoplay or sliding glass doors.
   */
  const renderBillboardState = useCallback(
    (continuousIdx: number, power: number, entryProgress = 1) => {
      const clampedPower = clamp01(power);
      const entryClamped = clamp01(entryProgress);

      lastBillboardRenderArgsRef.current = {
        idx: continuousIdx,
        power: clampedPower,
        entry: entryClamped,
      };

      const rootEl = billboardRootRef.current;
      if (rootEl) {
        rootEl.style.opacity = clampedPower.toFixed(3);
        const isActive = clampedPower > 0.02;
        rootEl.dataset.billboardActive = isActive ? "true" : "false";
        rootEl.dataset.billboardTriplet = isActive
          ? formatBillboardLineup(continuousIdx)
          : "";
        rootEl.dataset.billboardSource = "my-work-exclusive";
        rootEl.dataset.scrollIndex = isActive ? continuousIdx.toFixed(3) : "0.000";
      }

      ledRendererRef.current?.render(
        continuousIdx,
        clampedPower,
        entryClamped,
        renderedDeviceScaleRef.current
      );
    },
    []
  );

  /**
   * Synchronizes hardware-accelerated horizontal sliding door transforms (`translateX`),
   * unobstructed warm threshold illumination in the opened doorway gap, and Apple-inspired
   * liquid-glass surface blooms & diagonal specular reflections.
   */
  const syncSlidingDoorDOM = useCallback(() => {
    const st = doorAnimStateRef.current;
    const leftEl = leftSlidingDoorGroupRef.current;
    const rightEl = rightSlidingDoorGroupRef.current;

    const leftOpenFrac = clamp01(
      Math.abs(st.leftDx) / Math.abs(LEFT_DOOR_OPEN_DX)
    );
    const rightOpenFrac = clamp01(
      Math.abs(st.rightDx) / Math.abs(RIGHT_DOOR_OPEN_DX)
    );

    if (leftEl) {
      const dxStr = st.leftDx.toFixed(2);
      leftEl.setAttribute("transform", `translate(${dxStr}, 0)`);
      leftEl.dataset.doorOffsetX = dxStr;
    }
    if (rightEl) {
      const dxStr = st.rightDx.toFixed(2);
      rightEl.setAttribute("transform", `translate(${dxStr}, 0)`);
      rightEl.dataset.doorOffsetX = dxStr;
    }

    // Warm unobstructed studio light revealed in the physically opened doorway gap
    if (leftOpenApertureGlowRef.current) {
      const gapW = Math.max(0, -st.leftDx);
      leftOpenApertureGlowRef.current.setAttribute(
        "x",
        (DOOR_MEETING_SEAM_X - gapW).toFixed(2)
      );
      leftOpenApertureGlowRef.current.setAttribute("width", gapW.toFixed(2));
      leftOpenApertureGlowRef.current.style.opacity = (
        leftOpenFrac * 0.85
      ).toFixed(3);
    }
    if (rightOpenApertureGlowRef.current) {
      const gapW = Math.max(0, st.rightDx);
      rightOpenApertureGlowRef.current.setAttribute(
        "x",
        DOOR_MEETING_SEAM_X.toFixed(2)
      );
      rightOpenApertureGlowRef.current.setAttribute("width", gapW.toFixed(2));
      rightOpenApertureGlowRef.current.style.opacity = (
        rightOpenFrac * 0.85
      ).toFixed(3);
    }

    // Apple liquid-glass click activation bloom + travelling diagonal specular light streak
    if (leftDoorBloomRef.current) {
      leftDoorBloomRef.current.style.opacity = st.leftBloomOp.toFixed(3);
    }
    if (rightDoorBloomRef.current) {
      rightDoorBloomRef.current.style.opacity = st.rightBloomOp.toFixed(3);
    }

    if (leftDoorSheenRef.current) {
      leftDoorSheenRef.current.setAttribute(
        "x",
        (DOOR_PORTAL_X + st.leftSheenX).toFixed(2)
      );
      leftDoorSheenRef.current.style.opacity = st.leftSheenOp.toFixed(3);
    }
    if (rightDoorSheenRef.current) {
      rightDoorSheenRef.current.setAttribute(
        "x",
        (DOOR_MEETING_SEAM_X + st.rightSheenX).toFixed(2)
      );
      rightDoorSheenRef.current.style.opacity = st.rightSheenOp.toFixed(3);
    }

    // Crisp open-portal depth shadow cast next to each parted glass door's leading stile
    if (leftOpenEdgeShadowRef.current) {
      leftOpenEdgeShadowRef.current.setAttribute(
        "x",
        (DOOR_MEETING_SEAM_X + st.leftDx).toFixed(2)
      );
      leftOpenEdgeShadowRef.current.style.opacity = (
        leftOpenFrac * 0.44
      ).toFixed(3);
    }
    if (rightOpenEdgeShadowRef.current) {
      rightOpenEdgeShadowRef.current.setAttribute(
        "x",
        (DOOR_MEETING_SEAM_X + st.rightDx - 6).toFixed(2)
      );
      rightOpenEdgeShadowRef.current.style.opacity = (
        rightOpenFrac * 0.44
      ).toFixed(3);
    }
  }, []);

  const resetSlidingDoorsToClosed = useCallback(() => {
    const st = doorAnimStateRef.current;
    st.leftTl?.kill();
    st.rightTl?.kill();
    st.leftTl = null;
    st.rightTl = null;
    st.leftDx = 0;
    st.rightDx = 0;
    st.leftSheenX = -36;
    st.rightSheenX = -36;
    st.leftSheenOp = 0;
    st.rightSheenOp = 0;
    st.leftBloomOp = 0;
    st.rightBloomOp = 0;
    syncSlidingDoorDOM();
  }, [syncSlidingDoorDOM]);

  /**
   * Animates the selected glass entrance door horizontally along its architectural track:
   * 1. Delicate liquid-glass activation bloom (`~140 ms`) + smooth horizontal slide open (`480 ms`)
   *    carrying its slim anodized sash, pull handle, and diagonal specular light streak
   * 2. Brief architectural hold open (`200 ms`) while the 3-slot billboard completes its glide
   * 3. Fluid return glide (`540 ms`, `cubic-bezier(0.22, 1, 0.36, 1)`) back to exact `0.00` closed seam
   * Safely handles rapid clicks from any mid-slide position without jumping or misaligning.
   */
  const playPhysicalDoorSlide = useCallback(
    (side: "left" | "right") => {
      const st = doorAnimStateRef.current;

      // If the opposite door is partially open from an earlier click, close it smoothly to 0
      if (side === "left" && (st.rightTl || Math.abs(st.rightDx) > 0.05)) {
        st.rightTl?.kill();
        const closeOtherTl = gsap.timeline({
          onComplete: () => {
            st.rightTl = null;
          },
        });
        st.rightTl = closeOtherTl;
        closeOtherTl.to(st, {
          rightDx: 0,
          rightSheenOp: 0,
          rightBloomOp: 0,
          duration: prefersReducedMotion ? 0.18 : 0.4,
          ease: DOOR_ARCHITECTURAL_EASE,
          onUpdate: syncSlidingDoorDOM,
        });
      } else if (side === "right" && (st.leftTl || Math.abs(st.leftDx) > 0.05)) {
        st.leftTl?.kill();
        const closeOtherTl = gsap.timeline({
          onComplete: () => {
            st.leftTl = null;
          },
        });
        st.leftTl = closeOtherTl;
        closeOtherTl.to(st, {
          leftDx: 0,
          leftSheenOp: 0,
          leftBloomOp: 0,
          duration: prefersReducedMotion ? 0.18 : 0.4,
          ease: DOOR_ARCHITECTURAL_EASE,
          onUpdate: syncSlidingDoorDOM,
        });
      }

      if (side === "left") {
        st.leftTl?.kill();
        const remainingRatio = clamp01(
          Math.abs(LEFT_DOOR_OPEN_DX - st.leftDx) / Math.abs(LEFT_DOOR_OPEN_DX)
        );
        const openDur = prefersReducedMotion
          ? 0.2
          : Math.max(0.24, DOOR_OPEN_SECONDS * (0.45 + 0.55 * remainingRatio));
        const holdDur = prefersReducedMotion ? 0.1 : DOOR_HOLD_OPEN_SECONDS;
        const closeDur = prefersReducedMotion ? 0.22 : DOOR_CLOSE_SECONDS;

        st.leftSheenX = LEFT_DOOR_W + 14;
        const tl = gsap.timeline({
          onComplete: () => {
            st.leftDx = 0;
            st.leftSheenOp = 0;
            st.leftBloomOp = 0;
            st.leftTl = null;
            syncSlidingDoorDOM();
          },
        });
        st.leftTl = tl;

        tl.to(
          st,
          {
            leftDx: LEFT_DOOR_OPEN_DX,
            duration: openDur,
            ease: DOOR_ARCHITECTURAL_EASE,
            onUpdate: syncSlidingDoorDOM,
          },
          0
        );
        if (!prefersReducedMotion) {
          tl.to(
            st,
            {
              leftBloomOp: 0.92,
              duration: 0.13,
              ease: "sine.out",
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              leftBloomOp: 0.18,
              duration: Math.max(0.2, openDur - 0.08),
              ease: "sine.inOut",
              onUpdate: syncSlidingDoorDOM,
            },
            0.13
          );
          tl.to(
            st,
            {
              leftSheenOp: 0.34,
              duration: openDur * 0.34,
              ease: "sine.out",
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              leftSheenX: -40,
              duration: openDur + holdDur * 0.65,
              ease: DOOR_ARCHITECTURAL_EASE,
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              leftSheenOp: 0.08,
              duration: openDur * 0.66,
              ease: "sine.inOut",
              onUpdate: syncSlidingDoorDOM,
            },
            openDur * 0.34
          );
        }
        tl.to(
          st,
          {
            leftDx: 0,
            leftSheenOp: 0,
            leftBloomOp: 0,
            duration: closeDur,
            ease: DOOR_ARCHITECTURAL_EASE,
            onUpdate: syncSlidingDoorDOM,
          },
          openDur + holdDur
        );
      } else {
        st.rightTl?.kill();
        const remainingRatio = clamp01(
          Math.abs(RIGHT_DOOR_OPEN_DX - st.rightDx) / RIGHT_DOOR_OPEN_DX
        );
        const openDur = prefersReducedMotion
          ? 0.2
          : Math.max(0.24, DOOR_OPEN_SECONDS * (0.45 + 0.55 * remainingRatio));
        const holdDur = prefersReducedMotion ? 0.1 : DOOR_HOLD_OPEN_SECONDS;
        const closeDur = prefersReducedMotion ? 0.22 : DOOR_CLOSE_SECONDS;

        st.rightSheenX = -40;
        const tl = gsap.timeline({
          onComplete: () => {
            st.rightDx = 0;
            st.rightSheenOp = 0;
            st.rightBloomOp = 0;
            st.rightTl = null;
            syncSlidingDoorDOM();
          },
        });
        st.rightTl = tl;

        tl.to(
          st,
          {
            rightDx: RIGHT_DOOR_OPEN_DX,
            duration: openDur,
            ease: DOOR_ARCHITECTURAL_EASE,
            onUpdate: syncSlidingDoorDOM,
          },
          0
        );
        if (!prefersReducedMotion) {
          tl.to(
            st,
            {
              rightBloomOp: 0.92,
              duration: 0.13,
              ease: "sine.out",
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              rightBloomOp: 0.18,
              duration: Math.max(0.2, openDur - 0.08),
              ease: "sine.inOut",
              onUpdate: syncSlidingDoorDOM,
            },
            0.13
          );
          tl.to(
            st,
            {
              rightSheenOp: 0.34,
              duration: openDur * 0.34,
              ease: "sine.out",
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              rightSheenX: RIGHT_DOOR_W + 14,
              duration: openDur + holdDur * 0.65,
              ease: DOOR_ARCHITECTURAL_EASE,
              onUpdate: syncSlidingDoorDOM,
            },
            0
          );
          tl.to(
            st,
            {
              rightSheenOp: 0.08,
              duration: openDur * 0.66,
              ease: "sine.inOut",
              onUpdate: syncSlidingDoorDOM,
            },
            openDur * 0.34
          );
        }
        tl.to(
          st,
          {
            rightDx: 0,
            rightSheenOp: 0,
            rightBloomOp: 0,
            duration: closeDur,
            ease: DOOR_ARCHITECTURAL_EASE,
            onUpdate: syncSlidingDoorDOM,
          },
          openDur + holdDur
        );
      }
    },
    [prefersReducedMotion, syncSlidingDoorDOM]
  );

  const syncAutoplayAttr = useCallback((paused: boolean) => {
    carouselCtrlRef.current.isAutoplayPaused = paused;
    if (billboardRootRef.current) {
      billboardRootRef.current.dataset.autoplayPaused = paused
        ? "true"
        : "false";
    }
  }, []);

  const stopBillboardCarousel = useCallback(() => {
    const ctrl = carouselCtrlRef.current;
    ctrl.active = false;
    ctrl.isManualTransition = false;
    ctrl.pendingManualDirection = null;
    ctrl.powerTween?.kill();
    ctrl.powerTween = null;
    ctrl.tween?.kill();
    ctrl.tween = null;
    ctrl.autoTimer?.kill();
    ctrl.autoTimer = null;
    syncAutoplayAttr(false);
    resetSlidingDoorsToClosed();
  }, [resetSlidingDoorsToClosed, syncAutoplayAttr]);

  const executeManualDoorAndBillboardStep = useCallback(
    (
      direction: -1 | 1,
      scheduleAutoFn: (delaySeconds: number, isManualPauseWindow: boolean) => void
    ) => {
      const ctrl = carouselCtrlRef.current;
      if (!ctrl.active) return;

      ctrl.autoTimer?.kill();
      ctrl.autoTimer = null;
      syncAutoplayAttr(true);

      let nextTarget: number;
      if (ctrl.tween && ctrl.isManualTransition) {
        const candidate = ctrl.targetIndex + direction;
        if (Math.abs(candidate - ctrl.currentIndex) <= 2.25) {
          nextTarget = candidate;
        } else {
          nextTarget = ctrl.targetIndex;
        }
        ctrl.tween.kill();
        ctrl.tween = null;
      } else {
        ctrl.tween?.kill();
        ctrl.tween = null;
        nextTarget = Math.round(ctrl.currentIndex) + direction;
      }

      ctrl.targetIndex = nextTarget;
      ctrl.isManualTransition = true;

      // 1. Physically slide the selected glass entrance door horizontally along its track
      playPhysicalDoorSlide(direction < 0 ? "left" : "right");

      // 2. Simultaneously transition all 3 rooftop billboard slots in the requested direction
      const slideDuration = prefersReducedMotion
        ? 0.24
        : BILLBOARD_MANUAL_SLIDE_SECONDS;

      ctrl.tween = gsap.to(ctrl, {
        currentIndex: nextTarget,
        duration: slideDuration,
        ease: DOOR_ARCHITECTURAL_EASE,
        onUpdate: () => renderBillboardState(ctrl.currentIndex, 1, 1),
        onComplete: () => {
          ctrl.currentIndex = nextTarget;
          ctrl.isManualTransition = false;
          ctrl.tween = null;
          renderBillboardState(nextTarget, 1, 1);
        },
      });

      // 3. Pause automatic rotation for 8 seconds (resetting if clicked again during the pause)
      scheduleAutoFn(slideDuration + BILLBOARD_MANUAL_PAUSE_SECONDS, true);
    },
    [
      playPhysicalDoorSlide,
      prefersReducedMotion,
      renderBillboardState,
      syncAutoplayAttr,
    ]
  );

  const scheduleNextAutoAdvance = useCallback(
    (delaySeconds: number, isManualPauseWindow = false) => {
      const ctrl = carouselCtrlRef.current;
      ctrl.autoTimer?.kill();
      ctrl.autoTimer = null;

      if (!ctrl.active || prefersReducedMotion) {
        syncAutoplayAttr(false);
        return;
      }

      syncAutoplayAttr(isManualPauseWindow);

      const timer = gsap.delayedCall(delaySeconds, () => {
        if (!ctrl.active) return;
        syncAutoplayAttr(false);
        ctrl.isManualTransition = false;
        const nextTarget = Math.round(ctrl.targetIndex) + 1;
        ctrl.targetIndex = nextTarget;
        ctrl.tween?.kill();
        ctrl.tween = gsap.to(ctrl, {
          currentIndex: nextTarget,
          duration: BILLBOARD_AUTO_SLIDE_SECONDS,
          ease: DOOR_ARCHITECTURAL_EASE,
          onUpdate: () => renderBillboardState(ctrl.currentIndex, 1, 1),
          onComplete: () => {
            ctrl.currentIndex = nextTarget;
            ctrl.tween = null;
            renderBillboardState(nextTarget, 1, 1);
            if (ctrl.pendingManualDirection !== null) {
              const queuedDir = ctrl.pendingManualDirection;
              ctrl.pendingManualDirection = null;
              executeManualDoorAndBillboardStep(
                queuedDir,
                scheduleNextAutoAdvance
              );
            } else {
              scheduleNextAutoAdvance(BILLBOARD_HOLD_SECONDS, false);
            }
          },
        });
        if (typeof document !== "undefined" && document.hidden) {
          ctrl.tween.pause();
        }
      });

      if (typeof document !== "undefined" && document.hidden) {
        timer.pause();
      }
      ctrl.autoTimer = timer;
    },
    [
      executeManualDoorAndBillboardStep,
      prefersReducedMotion,
      renderBillboardState,
      syncAutoplayAttr,
    ]
  );

  const startBillboardCarousel = useCallback(
    (initialIndex = 0, animatePowerOn = false) => {
      stopBillboardCarousel();
      const ctrl = carouselCtrlRef.current;
      ctrl.active = true;
      ctrl.currentIndex = initialIndex;
      ctrl.targetIndex = initialIndex;
      ctrl.isManualTransition = false;
      ctrl.pendingManualDirection = null;

      if (slidingDoorsSystemGroupRef.current) {
        slidingDoorsSystemGroupRef.current.style.opacity = "1";
      }
      setDoorControlsInteractive(true);

      if (animatePowerOn && !prefersReducedMotion) {
        ctrl.powerLevel = 0;
        ctrl.entryLevel = 0;
        renderBillboardState(initialIndex, 0, 0);
        const powerTween = gsap.to(ctrl, {
          powerLevel: 1,
          entryLevel: 1,
          duration: BILLBOARD_POWER_ON_SECONDS,
          ease: "power2.out",
          onUpdate: () => {
            renderBillboardState(
              ctrl.currentIndex,
              ctrl.powerLevel,
              ctrl.entryLevel
            );
          },
          onComplete: () => {
            ctrl.powerLevel = 1;
            ctrl.entryLevel = 1;
            ctrl.powerTween = null;
            renderBillboardState(ctrl.currentIndex, 1, 1);
            scheduleNextAutoAdvance(BILLBOARD_HOLD_SECONDS, false);
          },
        });
        if (typeof document !== "undefined" && document.hidden) {
          powerTween.pause();
        }
        ctrl.powerTween = powerTween;
      } else {
        ctrl.powerLevel = 1;
        ctrl.entryLevel = 1;
        renderBillboardState(initialIndex, 1, 1);
        scheduleNextAutoAdvance(BILLBOARD_HOLD_SECONDS, false);
      }
    },
    [
      prefersReducedMotion,
      renderBillboardState,
      scheduleNextAutoAdvance,
      stopBillboardCarousel,
    ]
  );

  /**
   * Triggered when the visitor clicks/taps the Left Glass Door (-1) or Right Glass Door (+1)
   * or presses Left/Right keyboard arrows.
   * If an automatic transition is mid-flight, safely finishes it first, then plays the door slide
   * and requested billboard transition, pausing automatic rotation for 8 seconds.
   */
  const handleDoorControlActivate = useCallback(
    (direction: -1 | 1) => {
      const ctrl = carouselCtrlRef.current;
      if (!ctrl.active) return;

      ctrl.autoTimer?.kill();
      ctrl.autoTimer = null;
      syncAutoplayAttr(true);

      // If an automatic transition is currently running, safely finish it before starting manual door+billboard step
      if (ctrl.tween && !ctrl.isManualTransition) {
        ctrl.pendingManualDirection = direction;
        ctrl.tween.timeScale(2.2);
        return;
      }

      executeManualDoorAndBillboardStep(direction, scheduleNextAutoAdvance);
    },
    [
      executeManualDoorAndBillboardStep,
      scheduleNextAutoAdvance,
      syncAutoplayAttr,
    ]
  );

  // Keyboard shortcuts (ArrowLeft / ArrowRight) when Home hero is active and no text input is focused
  useEffect(() => {
    if (!doorControlsInteractive || isIntroActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          active.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleDoorControlActivate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleDoorControlActivate(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [doorControlsInteractive, handleDoorControlActivate, isIntroActive]);

  /**
   * CRITICAL CREATIVE OVERRIDE:
   * Synchronously configures a 100% EMPTY PURE WHITE CANVAS before browser paint.
   * Zero building, zero blueprint, zero lines, zero logo, zero text, zero cursor, zero shadows.
   */
  const applyEmptyWhiteCanvasState = useCallback(() => {
    stopBillboardCarousel();
    setDoorControlsInteractive(false);
    setHoveredDoor(null);
    setFocusedDoor(null);
    if (containerRef.current) {
      containerRef.current.dataset.animationStage = "stage-0-empty-white";
    }
    const hideEls = [
      openingStrokesGroupRef.current,
      f1GroupRef.current,
      f2GroupRef.current,
      f3GroupRef.current,
      f4GroupRef.current,
      f5GroupRef.current,
      f6GroupRef.current,
      f7GroupRef.current,
      f8GroupRef.current,
      f10GroupRef.current,
      curvedBillboardGroupRef.current,
      cleanLeftColumnGroupRef.current,
      cleanRightBayCoolGroupRef.current,
      cleanRightBayUpperGroupRef.current,
      stage9BrandGroupRef.current,
      penCursorRef.current,
      markerCursorRef.current,
      goldSparkGroupRef.current,
      slidingDoorsSystemGroupRef.current,
    ];
    hideEls.forEach((el) => {
      if (el) el.style.opacity = "0";
    });
    renderBillboardState(0, 0, 0);

    openingStrokeRefs.current.forEach((pathEl) => {
      if (!pathEl) return;
      const len = pathEl.getTotalLength?.() || 1200;
      pathEl.style.opacity = "0";
      pathEl.style.strokeDasharray = `${len}`;
      pathEl.style.strokeDashoffset = `${len}`;
    });

    [
      f1DetailCrownMaskRef.current,
      f1DetailUpperMaskRef.current,
      f1DetailGroundMaskRef.current,
    ].forEach((maskPath) => {
      if (!maskPath) return;
      const mLen = maskPath.getTotalLength?.() || 1600;
      maskPath.style.strokeDasharray = `${mLen}`;
      maskPath.style.strokeDashoffset = `${mLen}`;
    });

    if (f1EraseStop1Ref.current && f1EraseStop2Ref.current) {
      f1EraseStop1Ref.current.setAttribute("offset", "0%");
      f1EraseStop2Ref.current.setAttribute("offset", "0%");
    }

    if (signPatchCoolRef.current) signPatchCoolRef.current.style.opacity = "0";
    if (signPatchMidRef.current) signPatchMidRef.current.style.opacity = "0";
    if (signPatchWarmRef.current) signPatchWarmRef.current.style.opacity = "0";
    if (signPatchBacklitF10Ref.current) {
      signPatchBacklitF10Ref.current.style.opacity = "0";
    }
    if (f6WarmBloomRef.current) f6WarmBloomRef.current.style.opacity = "0";
    if (groundShadowRef.current) groundShadowRef.current.style.opacity = "0";
  }, [renderBillboardState, stopBillboardCarousel]);

  /**
   * Synchronously puts the SVG composition into the clean, settled Stage 10 state
   * showing sharp, unmodified Frame 10.png and starting Stage 2 (the automatic rightward
   * curved LED billboard carousel + glass door controls).
   */
  const applySettledFrame10State = useCallback(
    (animatePowerOn = false) => {
      if (containerRef.current) {
        containerRef.current.dataset.animationStage = "completed";
      }
      const hideEls = [
        openingStrokesGroupRef.current,
        f1GroupRef.current,
        f2GroupRef.current,
        f3GroupRef.current,
        f4GroupRef.current,
        f5GroupRef.current,
        f6GroupRef.current,
        f7GroupRef.current,
        f8GroupRef.current,
        curvedBillboardGroupRef.current,
        cleanLeftColumnGroupRef.current,
        cleanRightBayCoolGroupRef.current,
        cleanRightBayUpperGroupRef.current,
        stage9BrandGroupRef.current,
        penCursorRef.current,
        markerCursorRef.current,
        goldSparkGroupRef.current,
      ];
      hideEls.forEach((el) => {
        if (el) el.style.opacity = "0";
      });
      if (signPatchCoolRef.current) signPatchCoolRef.current.style.opacity = "0";
      if (signPatchMidRef.current) signPatchMidRef.current.style.opacity = "0";
      if (signPatchWarmRef.current) signPatchWarmRef.current.style.opacity = "0";
      if (signPatchBacklitF10Ref.current) {
        signPatchBacklitF10Ref.current.style.opacity = "0";
      }
      if (f6WarmBloomRef.current) f6WarmBloomRef.current.style.opacity = "0";

      if (f10GroupRef.current) f10GroupRef.current.style.opacity = "1";
      if (groundShadowRef.current) groundShadowRef.current.style.opacity = "0.08";
      startBillboardCarousel(0, animatePowerOn);
    },
    [startBillboardCarousel]
  );

  // Pause/resume construction, door slides & billboard carousel tweens/timers cleanly if user switches browser tabs
  useEffect(() => {
    const handleVisibility = () => {
      const tl = timelineRef.current;
      const ctrl = carouselCtrlRef.current;
      const dSt = doorAnimStateRef.current;
      if (document.hidden) {
        tl?.pause();
        ctrl.powerTween?.pause();
        ctrl.tween?.pause();
        ctrl.autoTimer?.pause();
        dSt.leftTl?.pause();
        dSt.rightTl?.pause();
      } else {
        if (isPlaying) tl?.resume();
        ctrl.powerTween?.resume();
        ctrl.tween?.resume();
        ctrl.autoTimer?.resume();
        dSt.leftTl?.resume();
        dSt.rightTl?.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPlaying]);

  // Mark session intro complete and clean up carousel controller on unmount
  useEffect(() => {
    return () => {
      stopBillboardCarousel();
      if (startedThisMountRef.current) {
        hasCompletedOfficeConstructionOnce = true;
      }
    };
  }, [stopBillboardCarousel]);

  // Synchronous layout initialization & Stage 1 Construction -> Stage 2 Billboard Carousel Handoff
  useLayoutEffect(() => {
    // 1. Reduced-motion or returning from another tab -> show settled Frame 10 + active rightward billboard immediately
    if (prefersReducedMotion || hasCompletedOfficeConstructionOnce) {
      hasCompletedOfficeConstructionOnce = true;
      applySettledFrame10State(false);
      setIsPlaying(false);
      return () => {
        stopBillboardCarousel();
      };
    }

    // 2. Always start Stage 1 from a 100% EMPTY PURE WHITE CANVAS before browser paint
    applyEmptyWhiteCanvasState();

    // Wait on pure empty white canvas while LandingHero curtain is active/exiting or assets finish decoding
    if (isIntroActive || !introCurtainCleared || !allAssetsReady) {
      return;
    }

    startedThisMountRef.current = true;
    setIsPlaying(true);

    // Measure exact path lengths once before starting timeline
    const strokeMetrics = OPENING_PEN_STROKES.map((def, idx) => {
      const el = openingStrokeRefs.current[idx];
      const len = el?.getTotalLength?.() || 600;
      const startPt = el?.getPointAtLength?.(0) || {
        x: PEN_INITIAL_ANCHOR[0],
        y: PEN_INITIAL_ANCHOR[1],
      };
      const endPt = el?.getPointAtLength?.(len) || startPt;
      if (el) {
        el.style.strokeDasharray = `${len}`;
        el.style.strokeDashoffset = `${len}`;
        el.style.opacity = "0";
      }
      return { def, el, len, startPt, endPt };
    });

    const detailSweepLen =
      detailPenSweepPathRef.current?.getTotalLength?.() || 950;
    const f1CrownMaskLen =
      f1DetailCrownMaskRef.current?.getTotalLength?.() || 1550;
    const f1UpperMaskLen =
      f1DetailUpperMaskRef.current?.getTotalLength?.() || 1250;
    const f1GroundMaskLen =
      f1DetailGroundMaskRef.current?.getTotalLength?.() || 1250;
    const markerGuideLen =
      markerGuidePathRef.current?.getTotalLength?.() || 3800;

    if (f1DetailCrownMaskRef.current) {
      f1DetailCrownMaskRef.current.style.strokeDasharray = `${f1CrownMaskLen}`;
    }
    if (f1DetailUpperMaskRef.current) {
      f1DetailUpperMaskRef.current.style.strokeDasharray = `${f1UpperMaskLen}`;
    }
    if (f1DetailGroundMaskRef.current) {
      f1DetailGroundMaskRef.current.style.strokeDasharray = `${f1GroundMaskLen}`;
    }

    const anim = {
      // Master linear clock for Opening Phase (0.00 - 3.80s)
      openingTime: 0,
      vectorStrokesMasterOpacity: 1,
      f1Erase: 0,

      // Stage 2 (3.80 - 4.90s): Completed Main Office Blueprint (Frame 2)
      f2Opacity: 0,
      f2Reveal: 0,
      f2EraseByF3: 0,

      // Stage 3 (4.90 - 6.30s): Black Structural Outline (Frame 3) + Marker Tool
      f3Opacity: 0,
      f3Reveal: 0,
      markerOpacity: 0,
      markerProgress: 0,

      // Stage 4 & 5 (6.30 - 8.70s): Glass Facade (below canopy) + Curved Matte Billboard + Smooth Charcoal Canopy
      f4Opacity: 0,
      f4GlassBays: 0,
      f4CanopyOpacity: 0,
      bbOpacity: 0,
      bbArc: 0,
      f5Opacity: 0,
      f5Canopy: 0,
      leftColOpacity: 0,
      leftColBrightness: 0.76,
      rightBayCoolOpacity: 0,
      rightBayUpperOpacity: 0,
      signCoolOpacity: 0,

      // Stage 6 (8.70 - 10.10s): Exterior Recessed Spotlights & Warm Amber LED Perimeter
      f6Opacity: 0,
      f6LedArc: 0,
      f6Bloom: 0,
      signMidOpacity: 0,

      // Stage 7 (10.10 - 11.50s): Upper-Floor Studio Illumination
      f7Opacity: 0,
      f7Upper: 0,
      signWarmOpacity: 0,

      // Stage 8 (11.50 - 12.50s): Ground-Floor Studio Illumination -> Handoff to Unbranded Frame 10
      f8Opacity: 0,
      f8Ground: 0,
      f10Opacity: 0,
      signBacklitF10Opacity: 0,

      // Stage 9 (12.50 - 14.80s): Original Brand Reveal (9A: KU Symbol -> 9B: KANIKA UNFRAMED Wordmark)
      s9MasterOpacity: 0,
      kuOpacity: 0,
      kuReveal: 0,
      wordmarkOpacity: 0,
      wordmarkReveal: 0,
      sparkOpacity: 0,
      sparkMode: 0,
      sparkProgress: 0,

      // Grounding shadow & Post-Frame-10 Curved Billboard Illumination
      groundShadow: 0,
      billboardPower: 0,
      billboardEntryReveal: 0,
    };

    const syncDom = () => {
      const ot = anim.openingTime;

      // =====================================================================
      // OPENING PHASE (0.00s - 3.80s):
      // 0.00 - 0.40s: 100% Empty Pure White Canvas
      // 0.40 - 0.80s: Phase 1 — Pen Tool Cursor Enters at (308, 250)
      // 0.80 - 3.16s: Phase 2 & 3 — Sequential Stroke-by-Stroke Architectural Drawing
      // 3.15 - 3.50s: Step 7 — Progressive Frame 1 Original Blueprint Details
      // 3.50 - 3.80s: Phase 4 — Completed Frame 1 Blueprint Settle
      // =====================================================================
      if (openingStrokesGroupRef.current) {
        const grpOp = ot < 0.8 ? 0 : anim.vectorStrokesMasterOpacity;
        openingStrokesGroupRef.current.style.opacity = grpOp.toFixed(3);
      }

      let penOpacity = 0;
      let penX = PEN_INITIAL_ANCHOR[0];
      let penY = PEN_INITIAL_ANCHOR[1];
      let penScale = 1;

      if (ot < 0.4) {
        // Completely empty pure white canvas — nothing visible
        penOpacity = 0;
        strokeMetrics.forEach((m) => {
          if (m.el) m.el.style.opacity = "0";
        });
      } else if (ot < 0.8) {
        // Phase 1: Pen Tool appears and settles onto precise starting point (308, 250)
        const enterP = smoothstep01((ot - 0.4) / 0.22);
        const poiseP = smoothstep01((ot - 0.4) / 0.28);
        penOpacity = enterP;
        penX = PEN_INITIAL_ANCHOR[0] + (1 - poiseP) * 9;
        penY = PEN_INITIAL_ANCHOR[1] + (1 - poiseP) * 11;
        if (ot >= 0.68) {
          const touchP = (ot - 0.68) / 0.12;
          penScale = 1 - 0.07 * Math.sin(Math.PI * clamp01(touchP));
        }
        strokeMetrics.forEach((m) => {
          if (m.el) m.el.style.opacity = "0";
        });
      } else {
        // Phase 2 & 3: Sequential stroke-by-stroke architectural drawing
        let activeCursorAssigned = false;

        for (let i = 0; i < strokeMetrics.length; i++) {
          const m = strokeMetrics[i];
          const el = m.el;
          if (!el) continue;

          if (ot <= m.def.drawStart) {
            el.style.opacity = "0";
            el.style.strokeDashoffset = `${m.len}`;
          } else if (ot >= m.def.drawEnd) {
            el.style.opacity = "1";
            el.style.strokeDashoffset = "0";
          } else {
            // Active stroke currently being drawn right behind the Pen Tool nib!
            const rawP =
              (ot - m.def.drawStart) / (m.def.drawEnd - m.def.drawStart);
            const easedP = cosineEaseInOut01(rawP);
            el.style.opacity = "1";
            el.style.strokeDashoffset = (m.len * (1 - easedP)).toFixed(2);

            const pt = el.getPointAtLength(easedP * m.len);
            penX = pt.x;
            penY = pt.y;
            penOpacity = 1;
            penScale = 1;
            activeCursorAssigned = true;
          }
        }

        // Check if ot is in a corner pause or smooth reposition glide between stroke i and i+1
        if (!activeCursorAssigned && ot <= 3.16) {
          for (let i = 0; i < strokeMetrics.length - 1; i++) {
            const curr = strokeMetrics[i];
            const next = strokeMetrics[i + 1];
            if (ot >= curr.def.drawEnd && ot <= next.def.drawStart) {
              const gapDur = Math.max(0.001, next.def.drawStart - curr.def.drawEnd);
              const gapP = smoothstep01((ot - curr.def.drawEnd) / gapDur);
              const dist = Math.hypot(
                next.startPt.x - curr.endPt.x,
                next.startPt.y - curr.endPt.y
              );
              penOpacity = 1;
              if (dist < 3) {
                // Natural pause right at architectural corner join
                penX = curr.endPt.x;
                penY = curr.endPt.y;
                penScale = 1 - 0.06 * Math.sin(Math.PI * gapP);
              } else {
                // Smooth lifted-pen glide directly to next architectural stroke start
                penX = curr.endPt.x + (next.startPt.x - curr.endPt.x) * gapP;
                penY = curr.endPt.y + (next.startPt.y - curr.endPt.y) * gapP;
                penScale = 1 + 0.05 * Math.sin(Math.PI * gapP);
              }
              activeCursorAssigned = true;
              break;
            }
          }
        }

        // Step 7 (3.16s - 3.52s): Finishing detail sweep & clean Pen Tool lift-off
        if (!activeCursorAssigned && ot > 3.16 && ot < 3.54) {
          const detailP = cosineEaseInOut01((ot - 3.16) / 0.32);
          if (detailPenSweepPathRef.current) {
            const pt = detailPenSweepPathRef.current.getPointAtLength(
              detailP * detailSweepLen
            );
            penX = pt.x;
            penY = pt.y;
          }
          penOpacity = 1 - smoothstep01((ot - 3.38) / 0.14);
          penScale = 1 + 0.06 * smoothstep01((ot - 3.38) / 0.14);
        }
      }

      if (penCursorRef.current) {
        penCursorRef.current.style.opacity = penOpacity.toFixed(3);
        if (penOpacity > 0.004) {
          const s = CURSOR_BASE_SCALE * penScale;
          penCursorRef.current.setAttribute(
            "transform",
            `translate(${penX.toFixed(1)}, ${penY.toFixed(1)}) scale(${s.toFixed(3)})`
          );
        }
      }

      // Step 7 & Phase 4: Original Frame 1 Blueprint Progressive Detail Mask & Handoff
      if (f1GroupRef.current) {
        // Strictly 0 before 3.14s (all unrevealed portions completely hidden!)
        const f1Vis = ot < 3.14 || ot >= 4.65 ? 0 : 1;
        f1GroupRef.current.style.opacity = `${f1Vis}`;
      }
      if (f1VisActive(ot)) {
        if (f1DetailCrownMaskRef.current) {
          const p1 = cosineEaseInOut01((ot - 3.14) / 0.17);
          f1DetailCrownMaskRef.current.style.strokeDashoffset = (
            f1CrownMaskLen *
            (1 - p1)
          ).toFixed(1);
        }
        if (f1DetailUpperMaskRef.current) {
          const p2 = cosineEaseInOut01((ot - 3.23) / 0.17);
          f1DetailUpperMaskRef.current.style.strokeDashoffset = (
            f1UpperMaskLen *
            (1 - p2)
          ).toFixed(1);
        }
        if (f1DetailGroundMaskRef.current) {
          const p3 = cosineEaseInOut01((ot - 3.32) / 0.18);
          f1DetailGroundMaskRef.current.style.strokeDashoffset = (
            f1GroundMaskLen *
            (1 - p3)
          ).toFixed(1);
        }
      }
      if (f1EraseStop1Ref.current && f1EraseStop2Ref.current) {
        const eLead = 2 + anim.f1Erase * 128;
        const eTail = eLead - 12;
        f1EraseStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(eTail / 100) * 100).toFixed(2)}%`
        );
        f1EraseStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(eLead / 100) * 100).toFixed(2)}%`
        );
      }

      // Stage 2: Frame 2 Main Blueprint + Complementary Inverse Erase during Stage 3
      if (f2GroupRef.current) {
        f2GroupRef.current.style.opacity = anim.f2Opacity.toFixed(3);
      }
      if (f2RevealStop1Ref.current && f2RevealStop2Ref.current) {
        const rLead = -6 + anim.f2Reveal * 126;
        const rTail = rLead - 14;
        f2RevealStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(rTail / 100) * 100).toFixed(2)}%`
        );
        f2RevealStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(rLead / 100) * 100).toFixed(2)}%`
        );
      }
      if (f2InverseStop1Ref.current && f2InverseStop2Ref.current) {
        const eraseLead = -8 + anim.f2EraseByF3 * 136;
        const eraseSolid = eraseLead - 12;
        f2InverseStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(eraseSolid / 100) * 100).toFixed(2)}%`
        );
        f2InverseStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(eraseLead / 100) * 100).toFixed(2)}%`
        );
      }

      // Stage 3: Frame 3 Black Structural Outlines + Synchronized Marker Tool
      if (f3GroupRef.current) {
        f3GroupRef.current.style.opacity = anim.f3Opacity.toFixed(3);
      }
      if (f3RevealStop1Ref.current && f3RevealStop2Ref.current) {
        const lead = -8 + anim.f3Reveal * 124;
        const tail = lead - 14;
        f3RevealStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        f3RevealStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }
      if (markerCursorRef.current) {
        markerCursorRef.current.style.opacity = anim.markerOpacity.toFixed(3);
        if (anim.markerOpacity > 0.005 && markerGuidePathRef.current) {
          const pt = markerGuidePathRef.current.getPointAtLength(
            clamp01(anim.markerProgress) * markerGuideLen
          );
          markerCursorRef.current.setAttribute(
            "transform",
            `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) scale(${CURSOR_BASE_SCALE})`
          );
        }
      }

      // Stage 4: Curved Glass Facade Bays + Smooth Canopy Soffit
      if (f4GroupRef.current) {
        f4GroupRef.current.style.opacity = anim.f4Opacity.toFixed(3);
      }
      if (f4CanopySoffitRef.current) {
        f4CanopySoffitRef.current.style.opacity =
          anim.f4CanopyOpacity.toFixed(3);
      }
      if (anim.f4Opacity > 0.005) {
        GLASS_FACADE_BAYS.forEach((bay, i) => {
          const rect = f4BayRectRefs.current[i];
          if (!rect) return;
          const start = bay.order * 0.14;
          const localP = clamp01((anim.f4GlassBays - start) / 0.56);
          const eased = 1 - Math.pow(1 - localP, 2.3);
          rect.setAttribute("height", (690 * eased).toFixed(1));
        });
      }

      // Surface A: Curved Matte-Black Upper Billboard
      if (curvedBillboardGroupRef.current) {
        curvedBillboardGroupRef.current.style.opacity =
          anim.bbOpacity.toFixed(3);
      }
      if (bbArcStop1Ref.current && bbArcStop2Ref.current) {
        const lead = -8 + anim.bbArc * 128;
        const tail = lead - 20;
        bbArcStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        bbArcStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }

      // Stage 5: Continuous Charcoal Canopy Construction
      if (f5GroupRef.current) {
        f5GroupRef.current.style.opacity = anim.f5Opacity.toFixed(3);
      }
      if (f5CanopyStop1Ref.current && f5CanopyStop2Ref.current) {
        const lead = -8 + anim.f5Canopy * 128;
        const tail = lead - 20;
        f5CanopyStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        f5CanopyStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }

      // Clean Left Fluted Column & Clean Right Glass Bay Composites (Stages 4-8)
      if (cleanLeftColumnGroupRef.current) {
        cleanLeftColumnGroupRef.current.style.opacity =
          anim.leftColOpacity.toFixed(3);
        cleanLeftColumnGroupRef.current.style.filter = `brightness(${anim.leftColBrightness.toFixed(2)})`;
      }
      if (cleanRightBayCoolGroupRef.current) {
        cleanRightBayCoolGroupRef.current.style.opacity =
          anim.rightBayCoolOpacity.toFixed(3);
      }
      if (cleanRightBayUpperGroupRef.current) {
        cleanRightBayUpperGroupRef.current.style.opacity =
          anim.rightBayUpperOpacity.toFixed(3);
      }

      // Stage 6: Exterior Recessed Spotlights & Curved Warm Amber LED
      if (f6GroupRef.current) {
        f6GroupRef.current.style.opacity = anim.f6Opacity.toFixed(3);
      }
      if (f6LedStop1Ref.current && f6LedStop2Ref.current) {
        const lead = -10 + anim.f6LedArc * 132;
        const tail = lead - 22;
        f6LedStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        f6LedStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }
      if (f6WarmBloomRef.current) {
        f6WarmBloomRef.current.style.opacity = anim.f6Bloom.toFixed(3);
      }

      // Stage 7: Upper-Floor Studio Illumination
      if (f7GroupRef.current) {
        f7GroupRef.current.style.opacity = anim.f7Opacity.toFixed(3);
      }
      if (f7UpperStop1Ref.current && f7UpperStop2Ref.current) {
        const lead = -8 + anim.f7Upper * 136;
        const tail = lead - 22;
        f7UpperStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        f7UpperStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }

      // Stage 8: Ground-Floor Studio Illumination
      if (f8GroupRef.current) {
        f8GroupRef.current.style.opacity = anim.f8Opacity.toFixed(3);
      }
      if (f8GroundStop1Ref.current && f8GroundStop2Ref.current) {
        const lead = -8 + anim.f8Ground * 136;
        const tail = lead - 22;
        f8GroundStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        f8GroundStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }

      // Unbranded Central Signage Masks (Stages 4-9)
      if (signPatchCoolRef.current) {
        signPatchCoolRef.current.style.opacity =
          anim.signCoolOpacity.toFixed(3);
      }
      if (signPatchMidRef.current) {
        signPatchMidRef.current.style.opacity = anim.signMidOpacity.toFixed(3);
      }
      if (signPatchWarmRef.current) {
        signPatchWarmRef.current.style.opacity =
          anim.signWarmOpacity.toFixed(3);
      }
      if (signPatchBacklitF10Ref.current) {
        signPatchBacklitF10Ref.current.style.opacity =
          anim.signBacklitF10Opacity.toFixed(3);
      }

      // Stage 9: Two-Stage Authentic Brand Reveal directly from Frame 10.png
      if (stage9BrandGroupRef.current) {
        stage9BrandGroupRef.current.style.opacity =
          anim.s9MasterOpacity.toFixed(3);
      }
      if (s9KuGroupRef.current) {
        s9KuGroupRef.current.style.opacity = anim.kuOpacity.toFixed(3);
      }
      if (s9KuStop1Ref.current && s9KuStop2Ref.current) {
        const lead = -6 + anim.kuReveal * 128;
        const tail = lead - 22;
        s9KuStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        s9KuStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }
      if (s9WordmarkGroupRef.current) {
        s9WordmarkGroupRef.current.style.opacity =
          anim.wordmarkOpacity.toFixed(3);
      }
      if (s9WordmarkStop1Ref.current && s9WordmarkStop2Ref.current) {
        const lead = -6 + anim.wordmarkReveal * 126;
        const tail = lead - 18;
        s9WordmarkStop1Ref.current.setAttribute(
          "offset",
          `${(clamp01(tail / 100) * 100).toFixed(2)}%`
        );
        s9WordmarkStop2Ref.current.setAttribute(
          "offset",
          `${(clamp01(lead / 100) * 100).toFixed(2)}%`
        );
      }
      if (goldSparkGroupRef.current) {
        goldSparkGroupRef.current.style.opacity = anim.sparkOpacity.toFixed(3);
        if (anim.sparkOpacity > 0.005) {
          let sx = 636;
          let sy = 436;
          if (anim.sparkMode < 0.5) {
            [sx, sy] = samplePolyline(
              KU_GOLD_TRACE_WAYPOINTS,
              anim.sparkProgress
            );
          } else {
            const p = clamp01(anim.sparkProgress);
            sx = 564 + p * 278;
            sy = 562;
          }
          goldSparkGroupRef.current.setAttribute(
            "transform",
            `translate(${sx.toFixed(1)}, ${sy.toFixed(1)})`
          );
        }
      }

      // Stage 10: Final Completed Office (Frame 10.png) + Post-Reveal Curved Billboard & Etched Door Controls
      if (f10GroupRef.current) {
        f10GroupRef.current.style.opacity = anim.f10Opacity.toFixed(3);
      }
      if (groundShadowRef.current) {
        groundShadowRef.current.style.opacity = anim.groundShadow.toFixed(3);
      }
      if (slidingDoorsSystemGroupRef.current) {
        slidingDoorsSystemGroupRef.current.style.opacity =
          anim.f10Opacity >= 0.995 ? "1" : "0";
      }
      renderBillboardState(0, anim.billboardPower, anim.billboardEntryReveal);

      if (containerRef.current && timelineRef.current) {
        const t = timelineRef.current.time();
        const st =
          t < 0.4
            ? "stage-0-empty-white"
            : t < 0.8
              ? "stage-1a-pen-enters"
              : t < 3.5
                ? "stage-1b-pen-drawing"
                : t < 3.8
                  ? "stage-1c-frame1-settle"
                  : t < 4.9
                    ? "stage-2-blueprint-complete"
                    : t < 6.3
                      ? "stage-3-outline"
                      : t < 7.55
                        ? "stage-4-glass"
                        : t < 8.7
                          ? "stage-5-canopy"
                          : t < 10.1
                            ? "stage-6-exterior-lights"
                            : t < 11.5
                              ? "stage-7-upper-lights"
                              : t < 12.5
                                ? "stage-8-ground-lights"
                                : t < 13.6
                                  ? "stage-9a-ku-symbol"
                                  : t < 14.8
                                    ? "stage-9b-wordmark"
                                    : t < 15.25
                                      ? "stage-10-final-hold"
                                      : "stage-10-billboard-reveal";
        containerRef.current.dataset.animationStage = st;
      }
    };

    function f1VisActive(ot: number): boolean {
      return ot >= 3.12 && ot < 4.65;
    }

    syncDom();

    const tl = gsap.timeline({
      onUpdate: syncDom,
      onComplete: () => {
        hasCompletedOfficeConstructionOnce = true;
        setIsPlaying(false);
        timelineRef.current = null;
        // Stage 1 construction has completely finished & settled -> launch Stage 2 billboard carousel
        applySettledFrame10State(true);
      },
    });
    timelineRef.current = tl;

    // =========================================================================
    // OPENING ARCHITECTURAL PEN DRAWING (0.00s - 3.80s):
    // - 0.00 - 0.40s: Completely empty pure white canvas
    // - 0.40 - 0.80s: Pen Tool cursor enters at starting anchor (308, 250)
    // - 0.80 - 3.50s: Architectural outlines progressively drawn stroke by stroke
    // - 3.50 - 3.80s: Completed Frame 1 blueprint settles
    // =========================================================================
    tl.to(
      anim,
      {
        openingTime: 4.7,
        duration: 4.7,
        ease: "none",
      },
      0
    );
    // Once Frame 1's identical lines & details are 100% revealed at 3.50s, seamlessly hand off helper strokes
    tl.to(
      anim,
      {
        vectorStrokesMasterOpacity: 0,
        duration: 0.14,
        ease: "sine.inOut",
      },
      3.42
    );

    // =========================================================================
    // STAGE 2 (3.80s - 4.90s): Completed Main Blueprint (Frame 2, Registered & Clean)
    // =========================================================================
    tl.to(
      anim,
      { f2Opacity: 1, duration: 0.22, ease: "power1.out" },
      3.8
    );
    tl.to(
      anim,
      {
        f2Reveal: 1,
        f1Erase: 1,
        duration: 0.78,
        ease: "power2.inOut",
      },
      3.82
    );

    // =========================================================================
    // STAGE 3 (4.90s - 6.30s): Black Structural Outline (Frame 3 + Marker Tool)
    // =========================================================================
    tl.set(anim, { f3Opacity: 1 }, 4.9);
    tl.to(
      anim,
      { markerOpacity: 1, duration: 0.18, ease: "power2.out" },
      4.9
    );
    tl.to(
      anim,
      {
        f3Reveal: 1,
        f2EraseByF3: 1,
        markerProgress: 1,
        duration: 1.3,
        ease: "power2.inOut",
      },
      4.92
    );
    tl.to(
      anim,
      { markerOpacity: 0, duration: 0.18, ease: "power2.in" },
      6.1
    );
    tl.set(anim, { f2Opacity: 0 }, 6.25);

    // =========================================================================
    // STAGE 4 & 5 (6.30s - 8.70s): Glass & Curved Canopy Construction
    // =========================================================================
    tl.to(
      anim,
      {
        f4Opacity: 1,
        signCoolOpacity: 1,
        groundShadow: 0.045,
        duration: 0.32,
        ease: "power2.out",
      },
      6.3
    );
    tl.to(
      anim,
      { f4GlassBays: 1, duration: 1.2, ease: "power2.inOut" },
      6.32
    );
    tl.to(
      anim,
      {
        f4CanopyOpacity: 1,
        leftColOpacity: 1,
        rightBayCoolOpacity: 1,
        duration: 0.68,
        ease: "power2.inOut",
      },
      6.82
    );
    tl.set(anim, { bbOpacity: 1 }, 6.92);
    tl.to(
      anim,
      { bbArc: 1, duration: 1.1, ease: "power2.inOut" },
      6.95
    );
    // Stage 5 Continuous Curved Charcoal Roof Canopy Construction
    tl.set(anim, { f5Opacity: 1 }, 7.52);
    tl.to(
      anim,
      {
        f5Canopy: 1,
        groundShadow: 0.06,
        duration: 1.08,
        ease: "power2.inOut",
      },
      7.55
    );
    tl.to(
      anim,
      { f3Opacity: 0, duration: 0.35, ease: "power1.out" },
      7.9
    );

    // =========================================================================
    // STAGE 6 (8.70s - 10.10s): Exterior Lighting (Recessed Spotlights & Warm Amber LED)
    // =========================================================================
    tl.set(anim, { f6Opacity: 1 }, 8.7);
    tl.to(
      anim,
      {
        f6LedArc: 1,
        signMidOpacity: 1,
        leftColBrightness: 0.88,
        duration: 1.2,
        ease: "power2.inOut",
      },
      8.72
    );
    tl.to(
      anim,
      { f6Bloom: 0.16, duration: 0.5, ease: "sine.out" },
      8.95
    );
    tl.to(
      anim,
      { f6Bloom: 0.05, duration: 0.5, ease: "sine.inOut" },
      9.5
    );
    tl.set(anim, { f4Opacity: 0, f5Opacity: 0, signCoolOpacity: 0 }, 10.0);

    // =========================================================================
    // STAGE 7 (10.10s - 11.50s): Upper-Floor Studio Illumination
    // =========================================================================
    tl.set(anim, { f7Opacity: 1 }, 10.1);
    tl.to(
      anim,
      {
        f7Upper: 1,
        signWarmOpacity: 1,
        rightBayUpperOpacity: 1,
        leftColBrightness: 0.95,
        duration: 1.25,
        ease: "power2.inOut",
      },
      10.12
    );
    tl.to(
      anim,
      { f6Bloom: 0, duration: 0.38, ease: "sine.out" },
      11.0
    );
    tl.set(anim, { f6Opacity: 0, signMidOpacity: 0 }, 11.44);

    // =========================================================================
    // STAGE 8 (11.50s - 12.50s): Ground-Floor Studio Illumination
    // =========================================================================
    tl.set(anim, { f8Opacity: 1 }, 11.5);
    tl.to(
      anim,
      {
        f8Ground: 1,
        rightBayCoolOpacity: 0,
        rightBayUpperOpacity: 0,
        leftColBrightness: 1,
        groundShadow: 0.075,
        duration: 0.78,
        ease: "power2.inOut",
      },
      11.52
    );
    tl.to(
      anim,
      {
        f10Opacity: 1,
        signBacklitF10Opacity: 1,
        groundShadow: 0.08,
        duration: 0.4,
        ease: "sine.inOut",
      },
      12.1
    );
    tl.set(
      anim,
      {
        f7Opacity: 0,
        f8Opacity: 0,
        bbOpacity: 0,
        leftColOpacity: 0,
        signWarmOpacity: 0,
      },
      12.52
    );

    // =========================================================================
    // STAGE 9 (12.52s - 14.80s): Dedicated Two-Stage Original Brand Reveal
    // =========================================================================
    tl.set(
      anim,
      { s9MasterOpacity: 1, sparkMode: 0, sparkProgress: 0 },
      12.52
    );

    // Stage 9A (12.55s - 13.55s): Complete Original KU Brand Symbol Reveal
    tl.to(
      anim,
      { sparkOpacity: 0.9, duration: 0.16, ease: "power2.out" },
      12.54
    );
    tl.to(
      anim,
      { kuOpacity: 1, duration: 0.3, ease: "power2.out" },
      12.56
    );
    tl.to(
      anim,
      {
        kuReveal: 1,
        sparkProgress: 1,
        duration: 0.94,
        ease: "power2.inOut",
      },
      12.56
    );

    // Stage 9B (13.56s - 14.70s): Complete Original KANIKA UNFRAMED Wordmark Reveal
    tl.set(anim, { sparkMode: 1, sparkProgress: 0 }, 13.55);
    tl.to(
      anim,
      { wordmarkOpacity: 1, duration: 0.26, ease: "power2.out" },
      13.57
    );
    tl.to(
      anim,
      {
        wordmarkReveal: 1,
        sparkProgress: 1,
        duration: 0.94,
        ease: "power2.inOut",
      },
      13.57
    );
    tl.to(
      anim,
      { sparkOpacity: 0, duration: 0.24, ease: "power2.in" },
      14.38
    );
    tl.to(
      anim,
      {
        signBacklitF10Opacity: 0,
        duration: 0.36,
        ease: "sine.inOut",
      },
      14.42
    );
    tl.set(anim, { s9MasterOpacity: 0 }, 14.8);

    // =========================================================================
    // STAGE 10 (14.80s - 15.18s): Completed Office Settles Fully Formed
    // - Curved rooftop billboard remains completely matte-black throughout Stage 1 construction
    // - Stage 2 (Curved LED Billboard illumination & 3.0s rightward carousel) starts ONLY
    //   when this construction timeline fires `onComplete`.
    // =========================================================================
    tl.to({}, { duration: 0.38 }, 14.8);

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [
    allAssetsReady,
    introCurtainCleared,
    isIntroActive,
    prefersReducedMotion,
    applyEmptyWhiteCanvasState,
    applySettledFrame10State,
    renderBillboardState,
    stopBillboardCarousel,
  ]);

  // Unique SVG defs IDs
  const f1SilhouetteClipId = `f1-arch-silhouette-${uid}`;
  const masterSilhouetteClipId = `master-arch-silhouette-${uid}`;
  const curvedBillboardClipId = `curved-upper-billboard-clip-${uid}`;
  const facadeBelowCanopyClipId = `facade-below-canopy-clip-${uid}`;
  const f4CanopySoffitClipId = `f4-canopy-soffit-clip-${uid}`;
  const f5CleanCanopyClipId = `f5-clean-canopy-clip-${uid}`;
  const f6RightCanopyRepairClipId = `f6-right-canopy-repair-clip-${uid}`;
  const leftFlutedColClipId = `left-fluted-col-clip-${uid}`;

  const centralSignInnerClipId = `central-sign-inner-clip-${uid}`;
  const cleanRightBayClipId = `clean-right-bay-clip-${uid}`;
  const cleanRightBayUpperClipId = `clean-right-bay-upper-clip-${uid}`;
  const pureWhitePaperFilterId = `pure-white-paper-${uid}`;
  const s9SoftEdgeFilterId = `s9-soft-edge-feather-${uid}`;

  const f1DetailMaskId = `f1-arch-detail-mask-${uid}`;
  const f1EraseGradId = `f1-erase-grad-${uid}`;
  const f1EraseMaskId = `f1-erase-mask-${uid}`;

  const f2MainCropClipId = `f2-main-crop-clip-${uid}`;
  const f2RevealGradId = `f2-reveal-grad-${uid}`;
  const f2InverseGradId = `f2-inverse-grad-${uid}`;
  const f2CompositeMaskId = `f2-composite-mask-${uid}`;
  const f2InverseMaskId = `f2-inverse-mask-${uid}`;

  const f3RevealGradId = `f3-reveal-grad-${uid}`;
  const f3MaskId = `f3-mask-${uid}`;

  const f4GlassBaysMaskId = `f4-glass-bays-mask-${uid}`;

  const bbArcGradId = `bb-arc-grad-${uid}`;
  const bbArcMaskId = `bb-arc-mask-${uid}`;

  const f5CanopyGradId = `f5-canopy-grad-${uid}`;
  const f5MaskId = `f5-mask-${uid}`;

  const f6LedGradId = `f6-led-grad-${uid}`;
  const f6MaskId = `f6-mask-${uid}`;
  const f6WarmGlowGradId = `f6-warm-glow-${uid}`;

  const f7UpperGradId = `f7-upper-grad-${uid}`;
  const f7MaskId = `f7-mask-${uid}`;

  const f8GroundGradId = `f8-ground-grad-${uid}`;
  const f8MaskId = `f8-mask-${uid}`;

  const signCoolGradId = `sign-cool-grad-${uid}`;
  const signMidGradId = `sign-mid-grad-${uid}`;
  const signWarmGradId = `sign-warm-grad-${uid}`;
  const signBacklitF10GradId = `sign-backlit-f10-grad-${uid}`;

  const s9KuGradId = `s9-ku-grad-${uid}`;
  const s9KuMaskId = `s9-ku-mask-${uid}`;
  const s9KuFeatherMaskId = `s9-ku-feather-mask-${uid}`;

  const s9WordmarkGradId = `s9-wordmark-grad-${uid}`;
  const s9WordmarkMaskId = `s9-wordmark-mask-${uid}`;
  const s9WordmarkFeatherMaskId = `s9-wordmark-feather-mask-${uid}`;

  const goldSparkGradId = `gold-spark-grad-${uid}`;
  const cursorShadowId = `tool-cursor-shadow-${uid}`;
  const groundShadowGradId = `office-ground-shadow-${uid}`;
  const doorPortalClipId = `sliding-door-portal-clip-${uid}`;
  const leftDoorGlassClipId = `left-door-glass-clip-${uid}`;
  const rightDoorGlassClipId = `right-door-glass-clip-${uid}`;
  const doorGlassBaseGradId = `door-glass-base-grad-${uid}`;
  const doorGlassHoverGradId = `door-glass-hover-grad-${uid}`;
  const doorLiquidRimGradId = `door-liquid-rim-grad-${uid}`;
  const doorClickBloomGradId = `door-click-bloom-grad-${uid}`;
  const doorApertureWarmGradId = `door-aperture-warm-grad-${uid}`;
  const doorMovingSheenGradId = `door-moving-sheen-grad-${uid}`;
  const leftOpenEdgeShadowGradId = `left-open-edge-shadow-grad-${uid}`;
  const rightOpenEdgeShadowGradId = `right-open-edge-shadow-grad-${uid}`;

  // Compute responsive percentage-based invisible hit areas directly over the Left & Right Glass Doors
  const doorHitAreasLayout = (() => {
    if (!svgMetrics) {
      return null;
    }
    const { originX, originY, scale, wrapWidth, wrapHeight } = svgMetrics;
    const toPxX = (svgX: number) => originX + (svgX - SVG_VIEWBOX_MIN_X) * scale;
    const toPxY = (svgY: number) => originY + (svgY - SVG_VIEWBOX_MIN_Y) * scale;

    // Physical glass door boundaries separated cleanly at the centre meeting seam (x = 693)
    const leftOuterPx = toPxX(622);
    const seamPx = toPxX(DOOR_MEETING_SEAM_X);
    const rightOuterPx = toPxX(789);
    const topPx = toPxY(DOOR_PORTAL_Y);
    const bottomPx = toPxY(DOOR_PORTAL_Y + DOOR_PORTAL_H);

    // Guarantee comfortable >= 44px non-overlapping touch areas on mobile while matching exact door height
    const leftRightEdge = seamPx - 1.25;
    const leftNaturalWidth = Math.max(0, leftRightEdge - leftOuterPx);
    const leftWidthPx = Math.max(44, leftNaturalWidth);
    const leftLeftPx = leftRightEdge - leftWidthPx;

    const rightLeftEdge = seamPx + 1.25;
    const rightNaturalWidth = Math.max(0, rightOuterPx - rightLeftEdge);
    const rightWidthPx = Math.max(44, rightNaturalWidth);
    const rightLeftPx = rightLeftEdge;

    const heightPx = Math.max(48, bottomPx - topPx);

    return {
      left: {
        leftPct: (leftLeftPx / wrapWidth) * 100,
        topPct: (topPx / wrapHeight) * 100,
        widthPct: (leftWidthPx / wrapWidth) * 100,
        heightPct: (heightPx / wrapHeight) * 100,
      },
      right: {
        leftPct: (rightLeftPx / wrapWidth) * 100,
        topPct: (topPx / wrapHeight) * 100,
        widthPct: (rightWidthPx / wrapWidth) * 100,
        heightPct: (heightPx / wrapHeight) * 100,
      },
    };
  })();

  // Compute exact percentage-locked HTML overlay box for the WebGL Curved LED Billboard (avoids Safari SVG <foreignObject> canvas bugs)
  const ledBillboardOverlayLayout = (() => {
    if (!svgMetrics) {
      return {
        leftPct:
          ((LED_FOREIGN_OBJECT_X - SVG_VIEWBOX_MIN_X) / SVG_VIEWBOX_WIDTH) *
          100,
        topPct:
          ((LED_FOREIGN_OBJECT_Y - SVG_VIEWBOX_MIN_Y) / SVG_VIEWBOX_HEIGHT) *
          100,
        widthPct: (LED_FOREIGN_OBJECT_W / SVG_VIEWBOX_WIDTH) * 100,
        heightPct: (LED_FOREIGN_OBJECT_H / SVG_VIEWBOX_HEIGHT) * 100,
      };
    }
    const { originX, originY, scale, wrapWidth, wrapHeight } = svgMetrics;
    const leftPx = originX + (LED_FOREIGN_OBJECT_X - SVG_VIEWBOX_MIN_X) * scale;
    const topPx = originY + (LED_FOREIGN_OBJECT_Y - SVG_VIEWBOX_MIN_Y) * scale;
    const widthPx = LED_FOREIGN_OBJECT_W * scale;
    const heightPx = LED_FOREIGN_OBJECT_H * scale;
    return {
      leftPct: (leftPx / wrapWidth) * 100,
      topPct: (topPx / wrapHeight) * 100,
      widthPct: (widthPx / wrapWidth) * 100,
      heightPct: (heightPx / wrapHeight) * 100,
    };
  })();

  const leftDoorActiveHover = hoveredDoor === "left" || focusedDoor === "left";
  const rightDoorActiveHover =
    hoveredDoor === "right" || focusedDoor === "right";

  return (
    <div
      ref={containerRef}
      data-animation-stage={
        showFinalOnMount ? "completed" : "stage-0-empty-white"
      }
      className="relative w-full flex flex-col items-center justify-center bg-white select-none"
    >
      <div
        ref={svgWrapperRef}
        className="relative w-full flex items-center justify-center"
      >
        <svg
          ref={svgRef}
          viewBox="-16 -18 1568 1048"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-h-[50dvh] sm:max-h-[52dvh] md:max-h-[54dvh] lg:max-h-[calc(100dvh-116px)] object-contain block"
          role="img"
          aria-label="Kanika Unframed architectural studio construction and brand reveal animation"
        >
          <defs>
            {/* Invisible SVG Motion Guide Paths for Step 7 Detail Sweep & Stage 3 Marker Tool */}
            <path
              ref={detailPenSweepPathRef}
              d={STAGE_1_DETAIL_PEN_SWEEP_PATH}
              fill="none"
            />
            <path
              ref={markerGuidePathRef}
              d={STAGE_3_MARKER_TRACE_PATH}
              fill="none"
            />

            {/* Dedicated Frame 1 Architectural Building Silhouette ClipPath */}
            <clipPath id={f1SilhouetteClipId} clipPathUnits="userSpaceOnUse">
              <path d={F1_ARCHITECTURAL_SILHOUETTE_PATH} />
            </clipPath>

            {/* Master Architectural Building Silhouette ClipPath (Frames 2-8) */}
            <clipPath
              id={masterSilhouetteClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <path d={MASTER_BUILDING_SILHOUETTE_PATH} />
            </clipPath>

            {/* Surface A: Curved Upper Matte-Black Billboard ClipPath */}
            <clipPath
              id={curvedBillboardClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <path d={CURVED_UPPER_BILLBOARD_PATH} />
            </clipPath>

            {/* Curved Glass Facade Strictly Below Canopy (Stage 4) */}
            <clipPath
              id={facadeBelowCanopyClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <path d={CURVED_FACADE_BELOW_CANOPY_PATH} />
            </clipPath>

            {/* Smooth Unlit Curved Canopy Soffit Clip (Stage 4 -> 5) */}
            <clipPath id={f4CanopySoffitClipId} clipPathUnits="userSpaceOnUse">
              <path d="M 116 380 C 255 236, 545 198, 755 202 C 995 206, 1235 288, 1392 456 C 1392 486, 1364 508, 1332 520 C 1195 368, 985 314, 760 310 C 560 306, 340 338, 188 486 C 144 456, 116 418, 116 380 Z" />
            </clipPath>

            {/* Clean Continuous Charcoal Canopy Clip (Stage 5) */}
            <clipPath id={f5CleanCanopyClipId} clipPathUnits="userSpaceOnUse">
              <path d={STAGE_5_CLEAN_CANOPY_PATH} />
            </clipPath>

            {/* Right Canopy Edge Repair Clip for Stage 6 */}
            <clipPath
              id={f6RightCanopyRepairClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <rect x="1175" y="372" width="220" height="152" />
            </clipPath>

            {/* Clean Left Fluted Architectural Column Clip (Stages 4-8) */}
            <clipPath id={leftFlutedColClipId} clipPathUnits="userSpaceOnUse">
              <rect x="188" y="478" width="95" height="452" />
            </clipPath>

            {/* Clean Right Structural Glass Bay Clips (Stages 4-7) */}
            <clipPath id={cleanRightBayClipId} clipPathUnits="userSpaceOnUse">
              <path d={CLEAN_RIGHT_BAY_PATH} />
            </clipPath>
            <clipPath
              id={cleanRightBayUpperClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <path d="M 1228 430 L 1332 514 L 1332 642 L 1228 634 Z" />
            </clipPath>

            {/* Surface B: Exact Curved Inner Bezel ClipPath for Central Signage */}
            <clipPath
              id={centralSignInnerClipId}
              clipPathUnits="userSpaceOnUse"
            >
              <path d={CENTRAL_SIGN_INNER_BEZEL_PATH} />
            </clipPath>

            {/* Unifies #FCFCFC/#FEFEFE outer PNG margin pixels seamlessly into pure #FFFFFF page canvas */}
            <filter
              id={pureWhitePaperFilterId}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.016" intercept="0" />
                <feFuncG type="linear" slope="1.016" intercept="0" />
                <feFuncB type="linear" slope="1.016" intercept="0" />
              </feComponentTransfer>
            </filter>

            {/* Subtle Ground Contact Shadow */}
            <radialGradient id={groundShadowGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#18181b" stopOpacity="1" />
              <stop offset="62%" stopColor="#18181b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </radialGradient>

            {/* Step 7 (3.14 - 3.50s): Curved Architectural Stroke Mask for Remaining Frame 1 Details */}
            <linearGradient
              id={f1EraseGradId}
              gradientUnits="userSpaceOnUse"
              x1="120"
              y1="260"
              x2="1390"
              y2="760"
            >
              <stop ref={f1EraseStop1Ref} offset="0%" stopColor="#000000" />
              <stop ref={f1EraseStop2Ref} offset="0%" stopColor="#ffffff" />
            </linearGradient>
            <mask
              id={f1DetailMaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              {/* Starts 100% black — zero unrevealed Frame 1 content ever shows early */}
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill="#000000"
              />
              <path
                ref={f1DetailCrownMaskRef}
                d={F1_DETAIL_CROWN_MASK_PATH}
                fill="none"
                stroke="#ffffff"
                strokeWidth="360"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={f1DetailUpperMaskRef}
                d={F1_DETAIL_UPPER_MASK_PATH}
                fill="none"
                stroke="#ffffff"
                strokeWidth="360"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                ref={f1DetailGroundMaskRef}
                d={F1_DETAIL_GROUND_MASK_PATH}
                fill="none"
                stroke="#ffffff"
                strokeWidth="380"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </mask>
            <mask
              id={f1EraseMaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f1EraseGradId})`}
              />
            </mask>

            {/* Stage 2: Dedicated Main Building Crop (Frame 2 local space) + Complementary Erase Mask */}
            <clipPath id={f2MainCropClipId} clipPathUnits="userSpaceOnUse">
              <rect x="70" y="52" width="925" height="765" />
            </clipPath>
            <linearGradient
              id={f2RevealGradId}
              gradientUnits="userSpaceOnUse"
              x1="120"
              y1="260"
              x2="1390"
              y2="760"
            >
              <stop ref={f2RevealStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f2RevealStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <linearGradient
              id={f2InverseGradId}
              gradientUnits="userSpaceOnUse"
              x1="120"
              y1="140"
              x2="1390"
              y2="860"
            >
              <stop ref={f2InverseStop1Ref} offset="0%" stopColor="#000000" />
              <stop ref={f2InverseStop2Ref} offset="0%" stopColor="#ffffff" />
            </linearGradient>
            <mask
              id={f2CompositeMaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f2RevealGradId})`}
              />
            </mask>
            <mask
              id={f2InverseMaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f2InverseGradId})`}
              />
            </mask>

            {/* Stage 3: Black Structural Outline Reveal Mask */}
            <linearGradient
              id={f3RevealGradId}
              gradientUnits="userSpaceOnUse"
              x1="120"
              y1="140"
              x2="1390"
              y2="860"
            >
              <stop ref={f3RevealStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f3RevealStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={f3MaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f3RevealGradId})`}
              />
            </mask>

            {/* Stage 4: Curved Facade Bay Mask (strictly below canopy) */}
            <mask
              id={f4GlassBaysMaskId}
              maskUnits="userSpaceOnUse"
              x="180"
              y="305"
              width="1165"
              height="695"
            >
              <rect x="180" y="305" width="1165" height="695" fill="#000000" />
              {GLASS_FACADE_BAYS.map((bay, idx) => (
                <rect
                  key={bay.x}
                  ref={(el) => {
                    f4BayRectRefs.current[idx] = el;
                  }}
                  x={bay.x}
                  y="306"
                  width={bay.w}
                  height="0"
                  fill="#ffffff"
                />
              ))}
            </mask>

            {/* Surface A: Curved Billboard Arc Reveal Mask */}
            <linearGradient
              id={bbArcGradId}
              gradientUnits="userSpaceOnUse"
              x1="315"
              y1="180"
              x2="1288"
              y2="220"
            >
              <stop ref={bbArcStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={bbArcStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={bbArcMaskId}
              maskUnits="userSpaceOnUse"
              x="310"
              y="0"
              width="985"
              height="375"
            >
              <rect
                x="310"
                y="0"
                width="985"
                height="375"
                fill={`url(#${bbArcGradId})`}
              />
            </mask>

            {/* Stage 5: Curved Charcoal Roof Canopy Mask */}
            <linearGradient
              id={f5CanopyGradId}
              gradientUnits="userSpaceOnUse"
              x1="120"
              y1="260"
              x2="1390"
              y2="420"
            >
              <stop ref={f5CanopyStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f5CanopyStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={f5MaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f5CanopyGradId})`}
              />
            </mask>

            {/* Stage 6: Exterior Lighting & Warm Amber LED Perimeter Mask */}
            <linearGradient
              id={f6LedGradId}
              gradientUnits="userSpaceOnUse"
              x1="118"
              y1="380"
              x2="1392"
              y2="380"
            >
              <stop ref={f6LedStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f6LedStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={f6MaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f6LedGradId})`}
              />
            </mask>
            <radialGradient id={f6WarmGlowGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffbe6b" stopOpacity="0.8" />
              <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Stage 7: Upper-Floor Studio Illumination Mask */}
            <radialGradient
              id={f7UpperGradId}
              gradientUnits="userSpaceOnUse"
              cx="740"
              cy="470"
              r="1280"
            >
              <stop ref={f7UpperStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f7UpperStop2Ref} offset="0%" stopColor="#000000" />
            </radialGradient>
            <mask
              id={f7MaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f7UpperGradId})`}
              />
            </mask>

            {/* Stage 8: Ground-Floor Studio Illumination Mask */}
            <radialGradient
              id={f8GroundGradId}
              gradientUnits="userSpaceOnUse"
              cx="680"
              cy="780"
              r="1280"
            >
              <stop ref={f8GroundStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={f8GroundStop2Ref} offset="0%" stopColor="#000000" />
            </radialGradient>
            <mask
              id={f8MaskId}
              maskUnits="userSpaceOnUse"
              x="-16"
              y="-18"
              width="1568"
              height="1048"
            >
              <rect
                x="-16"
                y="-18"
                width="1568"
                height="1048"
                fill={`url(#${f8GroundGradId})`}
              />
            </mask>

            {/* Unbranded Central Signage Gradients (full curved inner bezel 516..885 x 420..602) */}
            <radialGradient
              id={signCoolGradId}
              gradientUnits="userSpaceOnUse"
              cx="698"
              cy="515"
              r="210"
            >
              <stop offset="0%" stopColor="#e5dcd4" />
              <stop offset="68%" stopColor="#dcd2c9" />
              <stop offset="100%" stopColor="#cbc0b6" />
            </radialGradient>
            <radialGradient
              id={signMidGradId}
              gradientUnits="userSpaceOnUse"
              cx="698"
              cy="515"
              r="210"
            >
              <stop offset="0%" stopColor="#ead9c9" />
              <stop offset="68%" stopColor="#decbc0" />
              <stop offset="100%" stopColor="#c3afa0" />
            </radialGradient>
            <radialGradient
              id={signWarmGradId}
              gradientUnits="userSpaceOnUse"
              cx="698"
              cy="515"
              r="210"
            >
              <stop offset="0%" stopColor="#f4d4b6" />
              <stop offset="65%" stopColor="#e3bea0" />
              <stop offset="100%" stopColor="#be997c" />
            </radialGradient>
            <radialGradient
              id={signBacklitF10GradId}
              gradientUnits="userSpaceOnUse"
              cx="698"
              cy="538"
              r="218"
            >
              <stop offset="0%" stopColor="#fcc381" />
              <stop offset="48%" stopColor="#d9a67c" />
              <stop offset="82%" stopColor="#af8566" />
              <stop offset="100%" stopColor="#8d6a50" />
            </radialGradient>

            <filter
              id={s9SoftEdgeFilterId}
              x="-15%"
              y="-20%"
              width="130%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="5.5" />
            </filter>

            {/* Stage 9A: Authentic Frame 10 KU Brand Symbol Reveal */}
            <linearGradient
              id={s9KuGradId}
              gradientUnits="userSpaceOnUse"
              x1="612"
              y1="430"
              x2="782"
              y2="544"
            >
              <stop ref={s9KuStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={s9KuStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={s9KuFeatherMaskId}
              maskUnits="userSpaceOnUse"
              x="585"
              y="418"
              width="230"
              height="132"
            >
              <rect x="585" y="418" width="230" height="132" fill="#000000" />
              <ellipse
                cx="698"
                cy="486"
                rx="90"
                ry="56"
                fill="#ffffff"
                filter={`url(#${s9SoftEdgeFilterId})`}
              />
            </mask>
            <mask
              id={s9KuMaskId}
              maskUnits="userSpaceOnUse"
              x="585"
              y="418"
              width="230"
              height="132"
            >
              <rect
                x="585"
                y="418"
                width="230"
                height="132"
                fill={`url(#${s9KuGradId})`}
              />
            </mask>

            {/* Stage 9B: Authentic Frame 10 KANIKA UNFRAMED Wordmark Reveal */}
            <linearGradient
              id={s9WordmarkGradId}
              gradientUnits="userSpaceOnUse"
              x1="556"
              y1="562"
              x2="848"
              y2="562"
            >
              <stop ref={s9WordmarkStop1Ref} offset="0%" stopColor="#ffffff" />
              <stop ref={s9WordmarkStop2Ref} offset="0%" stopColor="#000000" />
            </linearGradient>
            <mask
              id={s9WordmarkFeatherMaskId}
              maskUnits="userSpaceOnUse"
              x="544"
              y="544"
              width="316"
              height="38"
            >
              <rect x="544" y="544" width="316" height="38" fill="#000000" />
              <rect
                x="556"
                y="549"
                width="290"
                height="26"
                rx="12"
                fill="#ffffff"
                filter={`url(#${s9SoftEdgeFilterId})`}
              />
            </mask>
            <mask
              id={s9WordmarkMaskId}
              maskUnits="userSpaceOnUse"
              x="544"
              y="544"
              width="316"
              height="38"
            >
              <rect
                x="544"
                y="544"
                width="316"
                height="38"
                fill={`url(#${s9WordmarkGradId})`}
              />
            </mask>

            {/* Subtle Warm Golden Leading Light Point (Stage 9) */}
            <radialGradient id={goldSparkGradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffdf2" stopOpacity="1" />
              <stop offset="28%" stopColor="#fde08d" stopOpacity="0.92" />
              <stop offset="62%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Crisp Shadow for Opening Pen Tool & Stage 3 Marker Tool */}
            <filter
              id={cursorShadowId}
              x="-35%"
              y="-35%"
              width="175%"
              height="175%"
            >
              <feDropShadow
                dx="1.5"
                dy="2.5"
                stdDeviation="2.2"
                floodColor="#09090b"
                floodOpacity="0.22"
              />
            </filter>

            {/* Physical Sliding Glass Entrance Doors ClipPaths & Apple Liquid-Glass Materials */}
            <clipPath id={doorPortalClipId} clipPathUnits="userSpaceOnUse">
              <rect
                x={DOOR_PORTAL_X}
                y={DOOR_PORTAL_Y}
                width={DOOR_PORTAL_W}
                height={DOOR_PORTAL_H}
              />
            </clipPath>

            <clipPath id={leftDoorGlassClipId} clipPathUnits="userSpaceOnUse">
              <rect
                x={DOOR_PORTAL_X}
                y={DOOR_PORTAL_Y}
                width={LEFT_DOOR_W}
                height={DOOR_PORTAL_H}
              />
            </clipPath>

            <clipPath id={rightDoorGlassClipId} clipPathUnits="userSpaceOnUse">
              <rect
                x={DOOR_MEETING_SEAM_X}
                y={DOOR_PORTAL_Y}
                width={RIGHT_DOOR_W}
                height={DOOR_PORTAL_H}
              />
            </clipPath>

            {/* Exterior architectural liquid-glass surface tint (creates realistic glass presence vs open gap) */}
            <linearGradient id={doorGlassBaseGradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4f8ff" stopOpacity="0.13" />
              <stop offset="28%" stopColor="#ffffff" stopOpacity="0.045" />
              <stop offset="48%" stopColor="#f8fbff" stopOpacity="0.11" />
              <stop offset="72%" stopColor="#fffaf2" stopOpacity="0.025" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
            </linearGradient>

            {/* Apple-inspired liquid-glass hover refraction & brightness lift */}
            <linearGradient id={doorGlassHoverGradId} x1="0" y1="0" x2="1" y2="0.92">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="26%" stopColor="#f7fbff" stopOpacity="0.08" />
              <stop offset="52%" stopColor="#ffffff" stopOpacity="0.19" />
              <stop offset="78%" stopColor="#fffcf5" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
            </linearGradient>

            {/* Delicate refractive rim highlight along hovered glass panel */}
            <linearGradient id={doorLiquidRimGradId} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
              <stop offset="35%" stopColor="#fffdf9" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#fff8eb" stopOpacity="0.28" />
            </linearGradient>

            {/* Subtle click-activation liquid-glass surface bloom */}
            <radialGradient id={doorClickBloomGradId} cx="50%" cy="46%" r="62%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="52%" stopColor="#fffcf5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* Warm unobstructed interior studio threshold air revealed when glass door slides open */}
            <linearGradient id={doorApertureWarmGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffedd4" stopOpacity="0.16" />
              <stop offset="46%" stopColor="#ffe3ba" stopOpacity="0.22" />
              <stop offset="86%" stopColor="#ffd8a3" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#ffeac8" stopOpacity="0.18" />
            </linearGradient>

            {/* Diagonal specular glass streak moving across door leaf during physical slide */}
            <linearGradient id={doorMovingSheenGradId} x1="0" y1="0" x2="1" y2="0.22">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="32%" stopColor="#fffef9" stopOpacity="0.52" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop offset="68%" stopColor="#fffef9" stopOpacity="0.46" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={leftOpenEdgeShadowGradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#140e08" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#140e08" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={rightOpenEdgeShadowGradId} x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#140e08" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#140e08" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Pure #FFFFFF Seamless Presentation Background */}
          <rect x="-16" y="-18" width="1568" height="1048" fill="#FFFFFF" />

          {/* Subtle Architectural Grounding Shadow (strictly 0 during empty white & blueprint phases) */}
          <ellipse
            ref={groundShadowRef}
            cx="758"
            cy="988"
            rx="595"
            ry="20"
            fill={`url(#${groundShadowGradId})`}
            style={{ opacity: showFinalOnMount ? 0.08 : 0 }}
            pointerEvents="none"
          />

          {/* ===============================================================
              STAGE 1 DETAIL LAYER: Original Frame 1.png Blueprint
              - 100% hidden (opacity 0 + black mask) during 0.0-3.14s!
              - Progressively reveals original blueprint details in Step 7 (3.14-3.50s)
              - Holds complete Frame 1 drawing across 3.50-3.80s before Frame 2
             =============================================================== */}
          <g
            ref={f1GroupRef}
            clipPath={`url(#${f1SilhouetteClipId})`}
            mask={`url(#${f1DetailMaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <g mask={`url(#${f1EraseMaskId})`}>
              <g transform="matrix(1.055, 0, 0, 0.96, 58, -65)">
                <image
                  href={OFFICE_CONSTRUCTION_FRAMES.frame1}
                  x="0"
                  y="0"
                  width="1312"
                  height="1199"
                  preserveAspectRatio="none"
                />
                {/* Suppress premature KU / KANIKA UNFRAMED while preserving sign bezel & mullions */}
                <rect
                  x="432"
                  y="494"
                  width="290"
                  height="148"
                  fill="#FFFFFF"
                />
                <rect x="372" y="770" width="142" height="98" fill="#FFFFFF" />
                <rect x="0" y="0" width="1312" height="66" fill="#FFFFFF" />
                <rect x="0" y="66" width="76" height="325" fill="#FFFFFF" />
                <rect x="0" y="480" width="196" height="580" fill="#FFFFFF" />
                <rect x="0" y="1046" width="198" height="150" fill="#FFFFFF" />
                <rect x="1236" y="66" width="76" height="445" fill="#FFFFFF" />
                <rect x="1202" y="1042" width="110" height="150" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          {/* ===============================================================
              OPENING ARCHITECTURAL PEN STROKES (0.80s - 3.50s)
              16 single-subpath architectural strokes pixel-registered to Frame 1.png,
              drawn strictly one by one directly behind the moving Pen Tool cursor.
             =============================================================== */}
          <g
            ref={openingStrokesGroupRef}
            clipPath={`url(#${f1SilhouetteClipId})`}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            {OPENING_PEN_STROKES.map((stroke, idx) => (
              <path
                key={stroke.id}
                ref={(el) => {
                  openingStrokeRefs.current[idx] = el;
                }}
                d={stroke.d}
                fill="none"
                stroke={BLUEPRINT_INK_COLOR}
                strokeWidth={stroke.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0 }}
              />
            ))}
          </g>

          {/* ===============================================================
              STAGE 2 LAYER: Frame 2.png (Registered Main Office Blueprint)
             =============================================================== */}
          <g
            ref={f2GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f2CompositeMaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <g mask={`url(#${f2InverseMaskId})`}>
              <g
                transform="matrix(1.392, 0, 0, 1.262, -16, -68)"
                clipPath={`url(#${f2MainCropClipId})`}
              >
                <image
                  href={OFFICE_CONSTRUCTION_FRAMES.frame2}
                  x="0"
                  y="0"
                  width="1536"
                  height="1024"
                  preserveAspectRatio="none"
                />
                <rect
                  x="365"
                  y="392"
                  width="256"
                  height="122"
                  fill="#FFFFFF"
                />
                <rect x="70" y="430" width="128" height="385" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          {/* ===============================================================
              STAGE 3 LAYER: Frame 3.png (Registered Black Structural Outlines)
             =============================================================== */}
          <g
            ref={f3GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f3MaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <g transform="matrix(1.12, 0, 0, 1.078, -68, -30)">
              <image
                href={OFFICE_CONSTRUCTION_FRAMES.frame3}
                x="0"
                y="0"
                width="1536"
                height="1024"
                preserveAspectRatio="none"
              />
              <rect
                x="534"
                y="432"
                width="328"
                height="138"
                fill="#FFFFFF"
              />
            </g>
          </g>

          {/* ===============================================================
              STAGE 4 LAYER: Frame 4.png (Curved Glass Facade Installation)
             =============================================================== */}
          <g
            ref={f4GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <g
              clipPath={`url(#${facadeBelowCanopyClipId})`}
              mask={`url(#${f4GlassBaysMaskId})`}
            >
              <image
                href={OFFICE_CONSTRUCTION_FRAMES.frame4}
                x="0"
                y="0"
                width="1535"
                height="1024"
                preserveAspectRatio="none"
              />
            </g>
            <g
              ref={f4CanopySoffitRef}
              clipPath={`url(#${f4CanopySoffitClipId})`}
              style={{ opacity: 0 }}
            >
              <image
                href={OFFICE_CONSTRUCTION_FRAMES.frame4}
                x="0"
                y="0"
                width="1535"
                height="1024"
                preserveAspectRatio="none"
              />
            </g>
          </g>

          {/* ===============================================================
              STAGE 5 LAYER: Continuous Unlit Charcoal Canopy Construction
             =============================================================== */}
          <g
            ref={f5GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f5MaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <g
              clipPath={`url(#${f5CleanCanopyClipId})`}
              style={{ filter: "saturate(0) brightness(0.68) contrast(1.08)" }}
            >
              <image
                href={OFFICE_CONSTRUCTION_FRAMES.frame6}
                x="0"
                y="0"
                width="1535"
                height="1024"
                preserveAspectRatio="none"
              />
              <g clipPath={`url(#${f6RightCanopyRepairClipId})`}>
                <image
                  href={OFFICE_CONSTRUCTION_FRAMES.frame7}
                  x="0"
                  y="0"
                  width="1535"
                  height="1024"
                  preserveAspectRatio="none"
                />
              </g>
            </g>
          </g>

          {/* ===============================================================
              STAGE 6 LAYER: Frame 6.png (Exterior Recessed Spotlights & Amber LED)
             =============================================================== */}
          <g
            ref={f6GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f6MaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame6}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
            <g clipPath={`url(#${f6RightCanopyRepairClipId})`}>
              <image
                href={OFFICE_CONSTRUCTION_FRAMES.frame7}
                x="0"
                y="0"
                width="1535"
                height="1024"
                preserveAspectRatio="none"
              />
            </g>
          </g>
          <ellipse
            ref={f6WarmBloomRef}
            cx="758"
            cy="392"
            rx="615"
            ry="84"
            fill={`url(#${f6WarmGlowGradId})`}
            style={{ opacity: 0, mixBlendMode: "soft-light" }}
            pointerEvents="none"
          />

          {/* ===============================================================
              STAGE 7 LAYER: Frame 7.png (Upper-Floor Studio Illumination)
             =============================================================== */}
          <g
            ref={f7GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f7MaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame7}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>

          {/* ===============================================================
              STAGE 8 LAYER: Frame 8.png (Ground-Floor Studio Illumination)
             =============================================================== */}
          <g
            ref={f8GroupRef}
            clipPath={`url(#${masterSilhouetteClipId})`}
            mask={`url(#${f8MaskId})`}
            filter={`url(#${pureWhitePaperFilterId})`}
            style={{ opacity: 0, willChange: "opacity" }}
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame8}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>

          {/* Clean Left Fluted Column & Clean Right Glass Bay (Stages 4-8) */}
          <g
            ref={cleanLeftColumnGroupRef}
            clipPath={`url(#${leftFlutedColClipId})`}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame10}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>
          <g
            ref={cleanRightBayCoolGroupRef}
            clipPath={`url(#${cleanRightBayClipId})`}
            style={{
              opacity: 0,
              filter: "saturate(0.28) brightness(0.56) contrast(1.08)",
            }}
            pointerEvents="none"
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame8}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>
          <g
            ref={cleanRightBayUpperGroupRef}
            clipPath={`url(#${cleanRightBayUpperClipId})`}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame8}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>

          {/* ===============================================================
              SURFACE A: Upper Curved Matte-Black Billboard (Stages 4-8)
             =============================================================== */}
          <g
            ref={curvedBillboardGroupRef}
            clipPath={`url(#${curvedBillboardClipId})`}
            mask={`url(#${bbArcMaskId})`}
            style={{ opacity: 0, willChange: "opacity" }}
            pointerEvents="none"
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame10}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>

          {/* ===============================================================
              STAGE 10 FINAL LAYER: Original Frame 10.png (Completed Office)
             =============================================================== */}
          <g
            ref={f10GroupRef}
            filter={`url(#${pureWhitePaperFilterId})`}
            style={{
              opacity: showFinalOnMount ? 1 : 0,
              willChange: "opacity",
            }}
          >
            <image
              href={OFFICE_CONSTRUCTION_FRAMES.frame10}
              x="0"
              y="0"
              width="1535"
              height="1024"
              preserveAspectRatio="none"
            />
          </g>

          {/* ===============================================================
              CURVED PANORAMIC LED BILLBOARD RENDERED AS TOP-LEVEL HTML OVERLAY
              (Moved outside SVG <foreignObject> for 100% Safari/WebKit + Chrome parity)
             =============================================================== */}

          {/* ===============================================================
              SURFACE B: Clean Unbranded Central Signage Backing (Stages 4-9)
             =============================================================== */}
          <g
            clipPath={`url(#${centralSignInnerClipId})`}
            pointerEvents="none"
          >
            <rect
              ref={signPatchCoolRef}
              x="512"
              y="416"
              width="378"
              height="190"
              fill={`url(#${signCoolGradId})`}
              style={{ opacity: 0 }}
            />
            <rect
              ref={signPatchMidRef}
              x="512"
              y="416"
              width="378"
              height="190"
              fill={`url(#${signMidGradId})`}
              style={{ opacity: 0 }}
            />
            <rect
              ref={signPatchWarmRef}
              x="512"
              y="416"
              width="378"
              height="190"
              fill={`url(#${signWarmGradId})`}
              style={{ opacity: 0 }}
            />
            <rect
              ref={signPatchBacklitF10Ref}
              x="512"
              y="416"
              width="378"
              height="190"
              fill={`url(#${signBacklitF10GradId})`}
              style={{ opacity: 0 }}
            />
          </g>

          {/* ===============================================================
              STAGE 9 DEDICATED BRAND REVEAL (12.52s - 14.80s)
             =============================================================== */}
          <g
            ref={stage9BrandGroupRef}
            clipPath={`url(#${centralSignInnerClipId})`}
            filter={`url(#${pureWhitePaperFilterId})`}
            style={{ opacity: 0, willChange: "opacity" }}
            pointerEvents="none"
          >
            <g
              ref={s9KuGroupRef}
              mask={`url(#${s9KuMaskId})`}
              style={{ opacity: 0 }}
            >
              <g mask={`url(#${s9KuFeatherMaskId})`}>
                <image
                  href={OFFICE_CONSTRUCTION_FRAMES.frame10}
                  x="0"
                  y="0"
                  width="1535"
                  height="1024"
                  preserveAspectRatio="none"
                />
              </g>
            </g>
            <g
              ref={s9WordmarkGroupRef}
              mask={`url(#${s9WordmarkMaskId})`}
              style={{ opacity: 0 }}
            >
              <g mask={`url(#${s9WordmarkFeatherMaskId})`}>
                <image
                  href={OFFICE_CONSTRUCTION_FRAMES.frame10}
                  x="0"
                  y="0"
                  width="1535"
                  height="1024"
                  preserveAspectRatio="none"
                />
              </g>
            </g>
          </g>

          {/* Subtle Warm Golden Leading Light Point during Stage 9 Brand Reveal */}
          <g
            ref={goldSparkGroupRef}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            <circle cx="0" cy="0" r="19" fill={`url(#${goldSparkGradId})`} />
            <circle cx="0" cy="0" r="3" fill="#fffef5" />
          </g>

          {/* ===============================================================
              TOOL CURSOR 1 (OPENING STAGE): Adobe Illustrator Pen Tool
              Enters at 0.40-0.80s on empty white canvas and remains strictly
              attached to the active architectural drawing point across 0.80-3.50s.
             =============================================================== */}
          <g
            ref={penCursorRef}
            filter={`url(#${cursorShadowId})`}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            <g transform="rotate(-30)">
              <path
                d="M 0 0 L -8.2 18.6 L -4.6 25.2 L 4.6 25.2 L 8.2 18.6 Z"
                fill="#FFFFFF"
                stroke="#18181B"
                strokeWidth="1.85"
                strokeLinejoin="round"
              />
              <line
                x1="0"
                y1="0.8"
                x2="0"
                y2="13"
                stroke="#18181B"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="0" cy="14.4" r="1.8" fill="#18181B" />
              <rect
                x="-5.2"
                y="25.2"
                width="10.4"
                height="4.2"
                rx="1"
                fill="#18181B"
              />
            </g>
          </g>

          {/* ===============================================================
              TOOL CURSOR 2 (STAGE 3 ONLY): Adobe Illustrator Marker Tool
             =============================================================== */}
          <g
            ref={markerCursorRef}
            filter={`url(#${cursorShadowId})`}
            style={{ opacity: 0 }}
            pointerEvents="none"
          >
            <g transform="rotate(38)">
              <path
                d="M 0 0 L -4.2 6.5 L 3.8 8.2 L 4.5 1.8 Z"
                fill="#18181B"
              />
              <path
                d="M -4.5 6.6 L -6.8 14.5 L 6.8 14.5 L 4.2 8.0 Z"
                fill="#FFFFFF"
                stroke="#18181B"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <rect
                x="-7.2"
                y="14.5"
                width="14.4"
                height="20"
                rx="2.2"
                fill="#FFFFFF"
                stroke="#18181B"
                strokeWidth="1.85"
              />
              <rect
                x="-7.2"
                y="17.8"
                width="14.4"
                height="4.2"
                fill="#18181B"
              />
            </g>
          </g>

          {/* ===============================================================
              PHYSICAL SLIDING GLASS ENTRANCE DOORS (APPLE LIQUID-GLASS PORTAL)
              - Stationary reconstructed open doorway interior + warm open-threshold air
              - Left & Right movable glass leaves with dark-anodized sash frames,
                extracted pull handles, refractive edge bevels & liquid-glass sheen
              - Strictly clipped inside the stationary entrance portal (633..780 x 608..948)
              - Zero arrows, zero icons, zero circles, zero labels or visible UI buttons
             =============================================================== */}
          <g
            ref={slidingDoorsSystemGroupRef}
            clipPath={`url(#${doorPortalClipId})`}
            data-sliding-doors-ready={
              doorControlsInteractive ? "true" : "false"
            }
            style={{
              opacity: showFinalOnMount ? 1 : 0,
              willChange: "opacity",
            }}
            pointerEvents="none"
          >
            {/* Layer 1: Stationary clean open doorway interior (zero duplicate handles or handle floor reflections) */}
            <image
              href={SLIDING_DOOR_ASSETS.cleanDoorway}
              x={DOOR_PORTAL_X}
              y={DOOR_PORTAL_Y}
              width={DOOR_PORTAL_W}
              height={DOOR_PORTAL_H}
              filter={`url(#${pureWhitePaperFilterId})`}
              preserveAspectRatio="none"
            />

            {/* Unobstructed warm studio threshold light revealed in the physically opened gap */}
            <rect
              ref={leftOpenApertureGlowRef}
              x={DOOR_MEETING_SEAM_X}
              y={DOOR_PORTAL_Y + 2}
              width="0"
              height={DOOR_PORTAL_H - 4}
              fill={`url(#${doorApertureWarmGradId})`}
              style={{ opacity: 0 }}
            />
            <rect
              ref={rightOpenApertureGlowRef}
              x={DOOR_MEETING_SEAM_X}
              y={DOOR_PORTAL_Y + 2}
              width="0"
              height={DOOR_PORTAL_H - 4}
              fill={`url(#${doorApertureWarmGradId})`}
              style={{ opacity: 0 }}
            />

            {/* Crisp interior depth shadows cast beside each parted glass door's leading stile */}
            <rect
              ref={leftOpenEdgeShadowRef}
              x={DOOR_MEETING_SEAM_X}
              y={DOOR_PORTAL_Y}
              width="6"
              height={DOOR_PORTAL_H}
              fill={`url(#${leftOpenEdgeShadowGradId})`}
              style={{ opacity: 0 }}
            />
            <rect
              ref={rightOpenEdgeShadowRef}
              x={DOOR_MEETING_SEAM_X - 6}
              y={DOOR_PORTAL_Y}
              width="6"
              height={DOOR_PORTAL_H}
              fill={`url(#${rightOpenEdgeShadowGradId})`}
              style={{ opacity: 0 }}
            />

            {/* Layer 2: Physical Left Sliding Glass Door (slides horizontally left -26 -> Previous 3-up window) */}
            <g
              ref={leftSlidingDoorGroupRef}
              data-sliding-door="left"
              data-door-offset-x="0.00"
              style={{ willChange: "transform" }}
            >
              <g clipPath={`url(#${leftDoorGlassClipId})`}>
                {/* Ambient architectural exterior liquid-glass reflection */}
                <rect
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y}
                  width={LEFT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorGlassBaseGradId})`}
                  style={{ opacity: 0.9 }}
                />

                {/* Apple-inspired liquid-glass hover brightness & refraction lift (strictly on Left Glass Door) */}
                <rect
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y}
                  width={LEFT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorGlassHoverGradId})`}
                  data-door-hover-tint="left"
                  style={{
                    opacity:
                      leftDoorActiveHover && !prefersReducedMotion ? 1 : 0,
                    transition: "opacity 170ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />

                {/* Delicate click-activation liquid-glass surface bloom */}
                <rect
                  ref={leftDoorBloomRef}
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y}
                  width={LEFT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorClickBloomGradId})`}
                  style={{ opacity: 0 }}
                />

                {/* Diagonal specular glass light streak moving across the sliding panel */}
                <g
                  transform={`translate(0, ${DOOR_PORTAL_Y}) skewX(-11) translate(0, ${-DOOR_PORTAL_Y})`}
                >
                  <rect
                    ref={leftDoorSheenRef}
                    x={DOOR_PORTAL_X - 36}
                    y={DOOR_PORTAL_Y - 8}
                    width="30"
                    height={DOOR_PORTAL_H + 16}
                    fill={`url(#${doorMovingSheenGradId})`}
                    style={{ opacity: 0 }}
                  />
                </g>

                {/* Slim dark-anodized movable door sash: top/bottom carrier rails + outer stile */}
                <rect
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y}
                  width={LEFT_DOOR_W}
                  height="2.7"
                  fill="rgba(30, 25, 22, 0.68)"
                />
                <rect
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y + DOOR_PORTAL_H - 2.6}
                  width={LEFT_DOOR_W}
                  height="2.6"
                  fill="rgba(36, 30, 26, 0.56)"
                />
                <line
                  x1={DOOR_PORTAL_X + 0.75}
                  y1={DOOR_PORTAL_Y + 2}
                  x2={DOOR_PORTAL_X + 0.75}
                  y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 2}
                  stroke="rgba(34, 28, 24, 0.42)"
                  strokeWidth="1.3"
                />

                {/* Original Left Door vertical double-bar pull handle + moving floor reflection */}
                <image
                  href={SLIDING_DOOR_ASSETS.leftDoor}
                  x={DOOR_PORTAL_X}
                  y={DOOR_PORTAL_Y}
                  width={LEFT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  filter={`url(#${pureWhitePaperFilterId})`}
                  preserveAspectRatio="none"
                />

                {/* Restrained 1px Apple liquid-glass refractive perimeter rim on hover */}
                <rect
                  x={DOOR_PORTAL_X + 0.8}
                  y={DOOR_PORTAL_Y + 1.2}
                  width={LEFT_DOOR_W - 1.6}
                  height={DOOR_PORTAL_H - 2.4}
                  fill="none"
                  stroke={`url(#${doorLiquidRimGradId})`}
                  strokeWidth="1.05"
                  data-door-hover-rim="left"
                  style={{
                    opacity: leftDoorActiveHover ? 0.88 : 0,
                    transition: "opacity 170ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </g>

              {/* Movable leading meeting-edge anodized stile + polished tempered-glass prism bevel */}
              <line
                x1={DOOR_MEETING_SEAM_X - 1.5}
                y1={DOOR_PORTAL_Y + 1}
                x2={DOOR_MEETING_SEAM_X - 1.5}
                y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 1}
                stroke="rgba(32, 26, 22, 0.58)"
                strokeWidth="1.45"
              />
              <line
                x1={DOOR_MEETING_SEAM_X - 0.55}
                y1={DOOR_PORTAL_Y + 1}
                x2={DOOR_MEETING_SEAM_X - 0.55}
                y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 1}
                stroke={
                  leftDoorActiveHover
                    ? "rgba(255, 254, 250, 0.85)"
                    : "rgba(255, 252, 246, 0.52)"
                }
                strokeWidth="1.15"
                style={{ transition: "stroke 170ms ease" }}
              />
            </g>

            {/* Layer 3: Physical Right Sliding Glass Door (slides horizontally right +37 -> Next 3-up window) */}
            <g
              ref={rightSlidingDoorGroupRef}
              data-sliding-door="right"
              data-door-offset-x="0.00"
              style={{ willChange: "transform" }}
            >
              <g clipPath={`url(#${rightDoorGlassClipId})`}>
                {/* Ambient architectural exterior liquid-glass reflection */}
                <rect
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y}
                  width={RIGHT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorGlassBaseGradId})`}
                  style={{ opacity: 0.9 }}
                />

                {/* Apple-inspired liquid-glass hover brightness & refraction lift (strictly on Right Glass Door) */}
                <rect
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y}
                  width={RIGHT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorGlassHoverGradId})`}
                  data-door-hover-tint="right"
                  style={{
                    opacity:
                      rightDoorActiveHover && !prefersReducedMotion ? 1 : 0,
                    transition: "opacity 170ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />

                {/* Delicate click-activation liquid-glass surface bloom */}
                <rect
                  ref={rightDoorBloomRef}
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y}
                  width={RIGHT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  fill={`url(#${doorClickBloomGradId})`}
                  style={{ opacity: 0 }}
                />

                {/* Diagonal specular glass light streak moving across the sliding panel */}
                <g
                  transform={`translate(0, ${DOOR_PORTAL_Y}) skewX(-11) translate(0, ${-DOOR_PORTAL_Y})`}
                >
                  <rect
                    ref={rightDoorSheenRef}
                    x={DOOR_MEETING_SEAM_X - 36}
                    y={DOOR_PORTAL_Y - 8}
                    width="32"
                    height={DOOR_PORTAL_H + 16}
                    fill={`url(#${doorMovingSheenGradId})`}
                    style={{ opacity: 0 }}
                  />
                </g>

                {/* Slim dark-anodized movable door sash: top/bottom carrier rails + outer stile */}
                <rect
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y}
                  width={RIGHT_DOOR_W}
                  height="2.7"
                  fill="rgba(30, 25, 22, 0.68)"
                />
                <rect
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y + DOOR_PORTAL_H - 2.6}
                  width={RIGHT_DOOR_W}
                  height="2.6"
                  fill="rgba(36, 30, 26, 0.56)"
                />
                <line
                  x1={DOOR_MEETING_SEAM_X + RIGHT_DOOR_W - 0.75}
                  y1={DOOR_PORTAL_Y + 2}
                  x2={DOOR_MEETING_SEAM_X + RIGHT_DOOR_W - 0.75}
                  y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 2}
                  stroke="rgba(34, 28, 24, 0.42)"
                  strokeWidth="1.3"
                />

                {/* Original Right Door vertical double-bar pull handle + lock box + moving floor reflection */}
                <image
                  href={SLIDING_DOOR_ASSETS.rightDoor}
                  x={DOOR_MEETING_SEAM_X}
                  y={DOOR_PORTAL_Y}
                  width={RIGHT_DOOR_W}
                  height={DOOR_PORTAL_H}
                  filter={`url(#${pureWhitePaperFilterId})`}
                  preserveAspectRatio="none"
                />

                {/* Restrained 1px Apple liquid-glass refractive perimeter rim on hover */}
                <rect
                  x={DOOR_MEETING_SEAM_X + 0.8}
                  y={DOOR_PORTAL_Y + 1.2}
                  width={RIGHT_DOOR_W - 1.6}
                  height={DOOR_PORTAL_H - 2.4}
                  fill="none"
                  stroke={`url(#${doorLiquidRimGradId})`}
                  strokeWidth="1.05"
                  data-door-hover-rim="right"
                  style={{
                    opacity: rightDoorActiveHover ? 0.88 : 0,
                    transition: "opacity 170ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </g>

              {/* Movable leading meeting-edge anodized stile + polished tempered-glass prism bevel */}
              <line
                x1={DOOR_MEETING_SEAM_X + 1.5}
                y1={DOOR_PORTAL_Y + 1}
                x2={DOOR_MEETING_SEAM_X + 1.5}
                y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 1}
                stroke="rgba(32, 26, 22, 0.58)"
                strokeWidth="1.45"
              />
              <line
                x1={DOOR_MEETING_SEAM_X + 0.55}
                y1={DOOR_PORTAL_Y + 1}
                x2={DOOR_MEETING_SEAM_X + 0.55}
                y2={DOOR_PORTAL_Y + DOOR_PORTAL_H - 1}
                stroke={
                  rightDoorActiveHover
                    ? "rgba(255, 254, 250, 0.85)"
                    : "rgba(255, 252, 246, 0.52)"
                }
                strokeWidth="1.15"
                style={{ transition: "stroke 170ms ease" }}
              />
            </g>

            {/* Stationary Overhead Automatic Track Contact Shadow */}
            <line
              x1={DOOR_PORTAL_X}
              y1={DOOR_PORTAL_Y + 0.7}
              x2={DOOR_PORTAL_X + DOOR_PORTAL_W}
              y2={DOOR_PORTAL_Y + 0.7}
              stroke="rgba(20, 16, 14, 0.52)"
              strokeWidth="1.45"
            />
          </g>
        </svg>

        {/* Pure HTML WebGL Curved Panoramic LED Billboard Overlay (Sub-Pixel Registered to SVG Crown; Safari/WebKit Safe) */}
        <div
          ref={billboardRootRef}
          data-billboard-active="false"
          data-billboard-triplet=""
          data-billboard-source="my-work-exclusive"
          data-scroll-index="0.000"
          data-autoplay-paused="false"
          aria-hidden="true"
          style={{
            left: `${ledBillboardOverlayLayout.leftPct.toFixed(4)}%`,
            top: `${ledBillboardOverlayLayout.topPct.toFixed(4)}%`,
            width: `${ledBillboardOverlayLayout.widthPct.toFixed(4)}%`,
            height: `${ledBillboardOverlayLayout.heightPct.toFixed(4)}%`,
            opacity: showFinalOnMount ? 1 : 0,
            willChange: "opacity",
          }}
          className="absolute pointer-events-none select-none overflow-hidden"
        >
          <canvas
            ref={ledCanvasRef}
            width={LED_CANVAS_PIXEL_W}
            height={LED_CANVAS_PIXEL_H}
            data-curved-led-canvas="true"
            className="w-full h-full block pointer-events-none select-none"
          />
          <svg
            viewBox={`${LED_FOREIGN_OBJECT_X} ${LED_FOREIGN_OBJECT_Y} ${LED_FOREIGN_OBJECT_W} ${LED_FOREIGN_OBJECT_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none block"
          >
            <path
              d={CURVED_BILLBOARD_LED_SCREEN_PATH}
              fill="none"
              stroke="rgba(255, 248, 236, 0.14)"
              strokeWidth="1.15"
            />
          </svg>
        </div>

        {/* Invisible Responsive Percentage-Positioned Glass Door Hit Areas (Zero Visible Icons, Arrows, Rings or Buttons) */}
        {doorControlsInteractive && doorHitAreasLayout && !isIntroActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            data-door-hit-overlay="active"
          >
            <button
              type="button"
              data-door-hit="left"
              aria-label="Slide left entrance door to view previous billboard projects"
              onClick={() => handleDoorControlActivate(-1)}
              onMouseEnter={() => setHoveredDoor("left")}
              onMouseLeave={() =>
                setHoveredDoor((prev) => (prev === "left" ? null : prev))
              }
              onFocus={() => setFocusedDoor("left")}
              onBlur={() =>
                setFocusedDoor((prev) => (prev === "left" ? null : prev))
              }
              style={{
                left: `${doorHitAreasLayout.left.leftPct.toFixed(4)}%`,
                top: `${doorHitAreasLayout.left.topPct.toFixed(4)}%`,
                width: `${doorHitAreasLayout.left.widthPct.toFixed(4)}%`,
                height: `${doorHitAreasLayout.left.heightPct.toFixed(4)}%`,
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
              }}
              className="absolute pointer-events-auto cursor-pointer bg-transparent border-0 p-0 m-0 appearance-none outline-none focus:outline-none focus-visible:outline-none touch-manipulation"
            />

            <button
              type="button"
              data-door-hit="right"
              aria-label="Slide right entrance door to view next billboard projects"
              onClick={() => handleDoorControlActivate(1)}
              onMouseEnter={() => setHoveredDoor("right")}
              onMouseLeave={() =>
                setHoveredDoor((prev) => (prev === "right" ? null : prev))
              }
              onFocus={() => setFocusedDoor("right")}
              onBlur={() =>
                setFocusedDoor((prev) => (prev === "right" ? null : prev))
              }
              style={{
                left: `${doorHitAreasLayout.right.leftPct.toFixed(4)}%`,
                top: `${doorHitAreasLayout.right.topPct.toFixed(4)}%`,
                width: `${doorHitAreasLayout.right.widthPct.toFixed(4)}%`,
                height: `${doorHitAreasLayout.right.heightPct.toFixed(4)}%`,
                WebkitAppearance: "none",
                WebkitTapHighlightColor: "transparent",
              }}
              className="absolute pointer-events-auto cursor-pointer bg-transparent border-0 p-0 m-0 appearance-none outline-none focus:outline-none focus-visible:outline-none touch-manipulation"
            />
          </div>
        )}
      </div>
    </div>
  );
};
