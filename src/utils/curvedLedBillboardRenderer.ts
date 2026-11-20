/**
 * Photorealistic Adaptive Multi-Format Curved Panoramic LED Billboard Renderer (WebGL + 2D Fallback)
 *
 * Exclusively projects all unmodified original portfolio mockups from the project's "My Work" section
 * onto the curved architectural rooftop screen of `Frame 10.png` (`x = 332 .. 1270`,
 * `y = yTop(x) .. yBot(x)` in `1535 x 1024` master space):
 * - Streams all available My Work mockups seamlessly along a continuous cylindrical tape with zero blank frames
 * - Advances horizontally TOWARDS THE RIGHT on each transition (new mockups enter cleanly on the left at `x = 332`
 *   and glide towards the right across the curved LED display)
 * - Preserves 100% of every My Work mockup's original artwork and exact 1.000x native aspect ratio
 *   (`Square 1:1`, `Landscape`, `Vertical Rectangular`) with zero cropping, stretching, or squeezing
 * - Stationary physical SMD LED pixel matrix + subtle RGB subpixel triad + controlled outdoor LED vibrancy
 */

export const LED_FOREIGN_OBJECT_X = 328;
export const LED_FOREIGN_OBJECT_Y = 8;
export const LED_FOREIGN_OBJECT_W = 948;
export const LED_FOREIGN_OBJECT_H = 348;

// 3x supersampled internal canvas resolution (`2844 x 1044`) for ultra-fine Retina SMD LED diodes & crisp typography
export const LED_CANVAS_PIXEL_W = LED_FOREIGN_OBJECT_W * 3; // 2844
export const LED_CANVAS_PIXEL_H = LED_FOREIGN_OBJECT_H * 3; // 1044

const SCREEN_MIN_X = 332;
const SCREEN_MAX_X = 1270;
const SCREEN_SPAN_X = SCREEN_MAX_X - SCREEN_MIN_X; // 938
const SCREEN_CENTER_X = 0.5 * (SCREEN_MIN_X + SCREEN_MAX_X); // 801
const SCREEN_HALF_SPAN_X = 0.5 * SCREEN_SPAN_X; // 469
const LUT_WIDTH = 1024;
const LUT_HEIGHT = 2;
const Y_ENCODE_MAX = 360.0;

// Fixed physical cylindrical arc-aspect span of the curved rooftop LED screen (`ds = dx / (H(x) * cos(theta(x)))`).
// Displays ~4-5 full-height mockups simultaneously at exact 1.000x native aspect ratio while any 6 consecutive
// interleaved My Work mockups exceed 5.55, guaranteeing 7 GPU texture slots (`TEXTURE1..TEXTURE7`) cover 100% of the screen.
const SCREEN_CYLINDRICAL_ASPECT_SPAN = 5.55;
const VISIBLE_SLOT_COUNT = 7;

const FALLBACK_PANEL_ASPECTS: readonly number[] = [
  1.0,
  1.0,
  1448 / 1086,
  1024 / 1536,
  855 / 1024,
  1.0,
  1.0,
];

export type MockupFormatCategory = "square" | "landscape" | "rectangular";

/**
 * Automatically classifies a My Work mockup by its original pixel dimensions & aspect ratio.
 */
export function classifyMockupFormat(
  width: number,
  height: number
): MockupFormatCategory {
  if (width <= 0 || height <= 0) return "square";
  const ar = width / height;
  if (ar >= 0.92 && ar <= 1.08) return "square";
  return ar > 1.08 ? "landscape" : "rectangular";
}

interface CubicSegment {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly x3: number;
  readonly y3: number;
}

/**
 * Exact top cubic-Bezier segments of `CURVED_BILLBOARD_LED_SCREEN_PATH` (`x = 332 -> 1270`)
 */
const TOP_ARCH_SEGMENTS: readonly CubicSegment[] = [
  { x0: 332, y0: 146, x1: 338.3, y1: 140.3, x2: 355.3, y2: 122.8, x3: 370, y3: 112 },
  { x0: 370, y0: 112, x1: 384.7, y1: 101.2, x2: 401.7, y2: 90.3, x3: 420, y3: 81 },
  { x0: 420, y0: 81, x1: 438.3, y1: 71.7, x2: 458.3, y2: 63.7, x3: 480, y3: 56 },
  { x0: 480, y0: 56, x1: 501.7, y1: 48.3, x2: 525.8, y2: 40.8, x3: 550, y3: 35 },
  { x0: 550, y0: 35, x1: 574.2, y1: 29.2, x2: 600.0, y2: 24.3, x3: 625, y3: 21 },
  { x0: 625, y0: 21, x1: 650.0, y1: 17.7, x2: 675.0, y2: 16.2, x3: 700, y3: 15 },
  { x0: 700, y0: 15, x1: 725.0, y1: 13.8, x2: 750.0, y2: 13.5, x3: 775, y3: 14 },
  { x0: 775, y0: 14, x1: 800.0, y1: 14.5, x2: 825.0, y2: 15.7, x3: 850, y3: 18 },
  { x0: 850, y0: 18, x1: 875.0, y1: 20.3, x2: 900.0, y2: 23.5, x3: 925, y3: 28 },
  { x0: 925, y0: 28, x1: 950.0, y1: 32.5, x2: 975.0, y2: 38.2, x3: 1000, y3: 45 },
  { x0: 1000, y0: 45, x1: 1025.0, y1: 51.8, x2: 1050.8, y2: 59.5, x3: 1075, y3: 69 },
  { x0: 1075, y0: 69, x1: 1099.2, y1: 78.5, x2: 1122.5, y2: 89.7, x3: 1145, y3: 102 },
  { x0: 1145, y0: 102, x1: 1167.5, y1: 114.3, x2: 1192.5, y2: 130.3, x3: 1210, y3: 143 },
  { x0: 1210, y0: 143, x1: 1227.5, y1: 155.7, x2: 1240.0, y2: 168.3, x3: 1250, y3: 178 },
  { x0: 1250, y0: 178, x1: 1260.0, y1: 187.7, x2: 1266.7, y2: 197.2, x3: 1270, y3: 201 },
];

/**
 * Exact bottom canopy-arch cubic-Bezier segments of `CURVED_BILLBOARD_LED_SCREEN_PATH`
 * (reversed into ascending `x = 332 -> 1270` order for direct monotonic lookup)
 */
const BOTTOM_ARCH_SEGMENTS: readonly CubicSegment[] = [
  { x0: 332, y0: 240, x1: 338.3, y1: 238.3, x2: 355.3, y2: 233.5, x3: 370, y3: 230 },
  { x0: 370, y0: 230, x1: 384.7, y1: 226.5, x2: 401.7, y2: 222.3, x3: 420, y3: 219 },
  { x0: 420, y0: 219, x1: 438.3, y1: 215.7, x2: 458.3, y2: 212.7, x3: 480, y3: 210 },
  { x0: 480, y0: 210, x1: 501.7, y1: 207.3, x2: 525.8, y2: 204.7, x3: 550, y3: 203 },
  { x0: 550, y0: 203, x1: 574.2, y1: 201.3, x2: 600.0, y2: 200.5, x3: 625, y3: 200 },
  { x0: 625, y0: 200, x1: 650.0, y1: 199.5, x2: 675.0, y2: 199.5, x3: 700, y3: 200 },
  { x0: 700, y0: 200, x1: 725.0, y1: 200.5, x2: 750.0, y2: 201.2, x3: 775, y3: 203 },
  { x0: 775, y0: 203, x1: 800.0, y1: 204.8, x2: 825.0, y2: 207.7, x3: 850, y3: 211 },
  { x0: 850, y0: 211, x1: 875.0, y1: 214.3, x2: 900.0, y2: 218.3, x3: 925, y3: 223 },
  { x0: 925, y0: 223, x1: 950.0, y1: 227.7, x2: 975.0, y2: 232.7, x3: 1000, y3: 239 },
  { x0: 1000, y0: 239, x1: 1025.0, y1: 245.3, x2: 1050.8, y2: 253.0, x3: 1075, y3: 261 },
  { x0: 1075, y0: 261, x1: 1099.2, y1: 269.0, x2: 1122.5, y2: 277.8, x3: 1145, y3: 287 },
  { x0: 1145, y0: 287, x1: 1167.5, y1: 296.2, x2: 1192.5, y2: 307.5, x3: 1210, y3: 316 },
  { x0: 1210, y0: 316, x1: 1227.5, y1: 324.5, x2: 1240.0, y2: 332.5, x3: 1250, y3: 338 },
  { x0: 1250, y0: 338, x1: 1260.0, y1: 343.5, x2: 1266.7, y2: 347.2, x3: 1270, y3: 349 },
];

function evalCubic1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

function sampleArchAtX(segments: readonly CubicSegment[], x: number): number {
  if (x <= segments[0].x0) return segments[0].y0;
  const last = segments[segments.length - 1];
  if (x >= last.x3) return last.y3;

  let seg = segments[0];
  for (let i = 0; i < segments.length; i++) {
    if (x >= segments[i].x0 && x <= segments[i].x3) {
      seg = segments[i];
      break;
    }
  }

  let lo = 0;
  let hi = 1;
  for (let iter = 0; iter < 18; iter++) {
    const mid = 0.5 * (lo + hi);
    const xm = evalCubic1D(seg.x0, seg.x1, seg.x2, seg.x3, mid);
    if (xm < x) lo = mid;
    else hi = mid;
  }
  const t = 0.5 * (lo + hi);
  return evalCubic1D(seg.y0, seg.y1, seg.y2, seg.y3, t);
}

function writeUint16Pair(
  buf: Uint8Array,
  byteOffset: number,
  normA: number,
  normB: number
): void {
  const a = Math.round(Math.max(0, Math.min(1, normA)) * 65535);
  const b = Math.round(Math.max(0, Math.min(1, normB)) * 65535);
  const aHi = Math.floor(a / 256);
  const aLo = a - aHi * 256;
  const bHi = Math.floor(b / 256);
  const bLo = b - bHi * 256;
  buf[byteOffset] = aHi;
  buf[byteOffset + 1] = aLo;
  buf[byteOffset + 2] = bHi;
  buf[byteOffset + 3] = bLo;
}

interface ArchBaseGeometry {
  readonly yTopFloat: Float32Array;
  readonly yBotFloat: Float32Array;
  readonly heightFloat: Float32Array;
}

let cachedBaseGeometry: ArchBaseGeometry | null = null;

function getArchBaseGeometry(): ArchBaseGeometry {
  if (cachedBaseGeometry) return cachedBaseGeometry;

  const yTopFloat = new Float32Array(LUT_WIDTH);
  const yBotFloat = new Float32Array(LUT_WIDTH);
  const heightFloat = new Float32Array(LUT_WIDTH);

  for (let i = 0; i < LUT_WIDTH; i++) {
    const frac = i / (LUT_WIDTH - 1);
    const x = SCREEN_MIN_X + frac * SCREEN_SPAN_X;
    const yt = sampleArchAtX(TOP_ARCH_SEGMENTS, x);
    const yb = sampleArchAtX(BOTTOM_ARCH_SEGMENTS, x);
    yTopFloat[i] = yt;
    yBotFloat[i] = yb;
    heightFloat[i] = Math.max(1.0, yb - yt);
  }

  cachedBaseGeometry = { yTopFloat, yBotFloat, heightFloat };
  return cachedBaseGeometry;
}

interface CylindricalLutData {
  readonly lutRgba: Uint8Array; // 1024 x 2 RGBA: Row 0 = (yTop, yBot), Row 1 = (uCyl, cosTheta)
  readonly uCylFloat: Float32Array;
  readonly cosThetaFloat: Float32Array;
  readonly totalAspectSpan: number;
}

/**
 * Solves exact differential-geometry cylindrical parameterization `ds = dx / (H(x) * cos(theta(x)))`
 * so `integral_{332}^{1270} ds(x) === targetTotalAspect`, guaranteeing 1.000x native aspect ratio
 * along the front of the curved screen with natural cylindrical foreshortening toward both outer edges.
 */
function buildCylindricalLut(targetTotalAspect: number): CylindricalLutData {
  const geom = getArchBaseGeometry();
  const dx = SCREEN_SPAN_X / (LUT_WIDTH - 1);
  const uSignedPow = new Float32Array(LUT_WIDTH);
  for (let i = 0; i < LUT_WIDTH; i++) {
    const x = SCREEN_MIN_X + i * dx;
    const u = (x - SCREEN_CENTER_X) / SCREEN_HALF_SPAN_X; // [-1, +1]
    uSignedPow[i] = (u < 0 ? -1 : 1) * Math.pow(Math.abs(u), 2.4);
  }

  const integrateSpan = (sinMax: number): number => {
    let acc = 0;
    let prevDsDx = 0;
    for (let i = 0; i < LUT_WIDTH; i++) {
      const sinTh = uSignedPow[i] * sinMax;
      const cosTh = Math.sqrt(Math.max(0.06, 1 - sinTh * sinTh));
      const dsDx = 1 / (geom.heightFloat[i] * cosTh);
      if (i > 0) {
        acc += 0.5 * (prevDsDx + dsDx) * dx;
      }
      prevDsDx = dsDx;
    }
    return acc;
  };

  const minNaturalSpan = integrateSpan(0.0); // ~5.448
  let solvedSinMax = 0.0;
  if (targetTotalAspect > minNaturalSpan) {
    let lo = 0.0;
    let hi = 0.985;
    for (let iter = 0; iter < 30; iter++) {
      const mid = 0.5 * (lo + hi);
      if (integrateSpan(mid) < targetTotalAspect) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    solvedSinMax = 0.5 * (lo + hi);
  }

  const uCylFloat = new Float32Array(LUT_WIDTH);
  const cosThetaFloat = new Float32Array(LUT_WIDTH);
  const cumulativeS = new Float32Array(LUT_WIDTH);

  let prevDsDx = 0;
  for (let i = 0; i < LUT_WIDTH; i++) {
    const sinTh = uSignedPow[i] * solvedSinMax;
    const cosTh = Math.sqrt(Math.max(0.06, 1 - sinTh * sinTh));
    cosThetaFloat[i] = cosTh;
    const dsDx = 1 / (geom.heightFloat[i] * cosTh);
    if (i === 0) {
      cumulativeS[0] = 0;
    } else {
      cumulativeS[i] = cumulativeS[i - 1] + 0.5 * (prevDsDx + dsDx) * dx;
    }
    prevDsDx = dsDx;
  }

  const totalSpan = Math.max(1e-5, cumulativeS[LUT_WIDTH - 1]);
  const lutRgba = new Uint8Array(LUT_WIDTH * LUT_HEIGHT * 4);
  const row1Offset = LUT_WIDTH * 4;

  for (let i = 0; i < LUT_WIDTH; i++) {
    const uCyl = cumulativeS[i] / totalSpan;
    uCylFloat[i] = uCyl;

    // Row 0: 16-bit yTop, 16-bit yBot
    writeUint16Pair(
      lutRgba,
      i * 4,
      geom.yTopFloat[i] / Y_ENCODE_MAX,
      geom.yBotFloat[i] / Y_ENCODE_MAX
    );
    // Row 1: 16-bit uCyl, 16-bit cosTheta
    writeUint16Pair(lutRgba, row1Offset + i * 4, uCyl, cosThetaFloat[i]);
  }

  return {
    lutRgba,
    uCylFloat,
    cosThetaFloat,
    totalAspectSpan: totalSpan,
  };
}

interface PeriodicTapeMetrics {
  readonly count: number;
  readonly aspects: number[];
  readonly cumStarts: Float32Array; // length count + 1: [0, s1, ..., totalAspect]
  readonly totalAspect: number;
}

function computePeriodicTapeMetrics(aspectsInput: readonly number[]): PeriodicTapeMetrics {
  const source = aspectsInput.length > 0 ? aspectsInput : FALLBACK_PANEL_ASPECTS;
  const count = source.length;
  const aspects: number[] = [];
  const cumStarts = new Float32Array(count + 1);
  cumStarts[0] = 0.0;
  let sum = 0.0;

  for (let i = 0; i < count; i++) {
    const raw = source[i] ?? 1.0;
    const safe = Number.isFinite(raw) && raw > 0.15 ? raw : 1.0;
    aspects.push(safe);
    sum += safe;
    cumStarts[i + 1] = sum;
  }

  return {
    count,
    aspects,
    cumStarts,
    totalAspect: Math.max(1e-4, sum),
  };
}

/**
 * Maps continuous carousel `step` (`0 -> 1 -> 2 -> ...`) to `tapeStart ∈ [0, totalAspect)`
 * so that increasing `step` moves mockups horizontally TOWARDS THE RIGHT:
 * - Each new mockup enters cleanly at the LEFT edge (`x = 332`, `s = 0`)
 * - All visible mockups glide smoothly towards the RIGHT (`x = 1270`, `s = S_screen`)
 * - Continuous (`C^0` & `C^1`) across all positive and negative integers with seamless wraparound
 */
function stepToRightwardTapeStart(step: number, tape: PeriodicTapeMetrics): number {
  const M = tape.count;
  if (M <= 0) return 0;
  const k = Math.floor(step);
  const frac = step - k; // [0, 1)
  const pCurr = ((-k % M) + M) % M;
  const pIncoming = (pCurr - 1 + M) % M;
  const rawTapeStart = tape.cumStarts[pCurr] - frac * tape.aspects[pIncoming];
  return ((rawTapeStart % tape.totalAspect) + tape.totalAspect) % tape.totalAspect;
}

interface VisibleWindowFrame {
  readonly slotPanelIndices: number[]; // length 7
  readonly slotBounds: Float32Array; // length 8 in screen aspect units (`s ∈ [0, S_screen]`)
}

function resolveVisibleWindow(
  step: number,
  tape: PeriodicTapeMetrics
): VisibleWindowFrame {
  const M = tape.count;
  const tapeStart = stepToRightwardTapeStart(step, tape);

  let firstIdx = M - 1;
  for (let i = 0; i < M; i++) {
    if (tapeStart >= tape.cumStarts[i] && tapeStart < tape.cumStarts[i + 1]) {
      firstIdx = i;
      break;
    }
  }

  const localOffset = tapeStart - tape.cumStarts[firstIdx];
  const slotPanelIndices: number[] = new Array(VISIBLE_SLOT_COUNT);
  const slotBounds = new Float32Array(VISIBLE_SLOT_COUNT + 1);
  slotBounds[0] = -localOffset;

  for (let j = 0; j < VISIBLE_SLOT_COUNT; j++) {
    const pIdx = (firstIdx + j) % M;
    slotPanelIndices[j] = pIdx;
    slotBounds[j + 1] = slotBounds[j] + tape.aspects[pIdx];
  }

  return { slotPanelIndices, slotBounds };
}

/**
 * High-quality progressive 2x step-downsampling of full uncropped My Work `HTMLImageElement`
 * (`0, 0, naturalWidth, naturalHeight`) to match the 3x supersampled LED display height (~680px)
 * so WebGL `gl.LINEAR` sampling preserves razor-sharp typography without NPOT minification shimmer.
 */
function prepareUncroppedTextureSource(
  img: HTMLImageElement
): HTMLCanvasElement | HTMLImageElement {
  if (typeof document === "undefined") return img;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (srcW <= 0 || srcH <= 0) return img;

  const targetH = 680;
  if (srcH <= targetH * 1.15 && srcW <= targetH * 2.2) {
    return img;
  }

  const aspect = srcW / srcH;
  let curW = srcW;
  let curH = srcH;
  let curSource: CanvasImageSource = img;

  while (curH * 0.5 > targetH) {
    const nextH = Math.max(targetH, Math.round(curH * 0.5));
    const nextW = Math.max(1, Math.round(nextH * aspect));
    const stepCanvas = document.createElement("canvas");
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext("2d");
    if (!stepCtx) return img;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = "high";
    stepCtx.drawImage(curSource, 0, 0, curW, curH, 0, 0, nextW, nextH);
    curSource = stepCanvas;
    curW = nextW;
    curH = nextH;
  }

  const finalH = targetH;
  const finalW = Math.max(1, Math.round(finalH * aspect));
  const outCanvas = document.createElement("canvas");
  outCanvas.width = finalW;
  outCanvas.height = finalH;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return img;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(curSource, 0, 0, curW, curH, 0, 0, finalW, finalH);
  return outCanvas;
}

const VERTEX_SHADER_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uArchLut;
uniform sampler2D uSlot0;
uniform sampler2D uSlot1;
uniform sampler2D uSlot2;
uniform sampler2D uSlot3;
uniform sampler2D uSlot4;
uniform sampler2D uSlot5;
uniform sampler2D uSlot6;

uniform float uSlotBounds[8];
uniform float uScreenAspectSpan;
uniform float uPower;
uniform float uEntryReveal;
uniform float uRenderedScale;

const float FO_X = 328.0;
const float FO_Y = 8.0;
const float FO_W = 948.0;
const float FO_H = 348.0;

const float X_MIN = 332.0;
const float X_MAX = 1270.0;
const float X_SPAN = 938.0;
const float Y_ENCODE_MAX = 360.0;

// Stationary Physical Curved SMD LED Hardware Matrix (560 x 98 = 5.714:1 exact square diode pitch)
const float LED_COLS = 560.0;
const float LED_ROWS = 98.0;

vec2 decodeLutRow(float xFrac, float rowV) {
  float u = clamp(xFrac, 0.0, 1.0);
  float texPos = u * 1023.0;
  float i0 = floor(texPos);
  float i1 = min(1023.0, i0 + 1.0);
  float f = texPos - i0;

  vec4 c0 = texture2D(uArchLut, vec2((i0 + 0.5) / 1024.0, rowV));
  vec4 c1 = texture2D(uArchLut, vec2((i1 + 0.5) / 1024.0, rowV));

  float a0 = (c0.r * 255.0 * 256.0 + c0.g * 255.0) / 65535.0;
  float b0 = (c0.b * 255.0 * 256.0 + c0.a * 255.0) / 65535.0;
  float a1 = (c1.r * 255.0 * 256.0 + c1.g * 255.0) / 65535.0;
  float b1 = (c1.b * 255.0 * 256.0 + c1.a * 255.0) / 65535.0;

  return vec2(mix(a0, a1, f), mix(b0, b1, f));
}

vec3 sampleVisibleSlotWindow(float uCyl, float vCyl) {
  float s = uCyl * uScreenAspectSpan;
  float localV = clamp(vCyl, 0.0015, 0.9985);

  if (s < uSlotBounds[1]) {
    float span = max(0.0001, uSlotBounds[1] - uSlotBounds[0]);
    float lu = clamp((s - uSlotBounds[0]) / span, 0.0015, 0.9985);
    return texture2D(uSlot0, vec2(lu, localV)).rgb;
  } else if (s < uSlotBounds[2]) {
    float span = max(0.0001, uSlotBounds[2] - uSlotBounds[1]);
    float lu = clamp((s - uSlotBounds[1]) / span, 0.0015, 0.9985);
    return texture2D(uSlot1, vec2(lu, localV)).rgb;
  } else if (s < uSlotBounds[3]) {
    float span = max(0.0001, uSlotBounds[3] - uSlotBounds[2]);
    float lu = clamp((s - uSlotBounds[2]) / span, 0.0015, 0.9985);
    return texture2D(uSlot2, vec2(lu, localV)).rgb;
  } else if (s < uSlotBounds[4]) {
    float span = max(0.0001, uSlotBounds[4] - uSlotBounds[3]);
    float lu = clamp((s - uSlotBounds[3]) / span, 0.0015, 0.9985);
    return texture2D(uSlot3, vec2(lu, localV)).rgb;
  } else if (s < uSlotBounds[5]) {
    float span = max(0.0001, uSlotBounds[5] - uSlotBounds[4]);
    float lu = clamp((s - uSlotBounds[4]) / span, 0.0015, 0.9985);
    return texture2D(uSlot4, vec2(lu, localV)).rgb;
  } else if (s < uSlotBounds[6]) {
    float span = max(0.0001, uSlotBounds[6] - uSlotBounds[5]);
    float lu = clamp((s - uSlotBounds[5]) / span, 0.0015, 0.9985);
    return texture2D(uSlot5, vec2(lu, localV)).rgb;
  }
  float span = max(0.0001, uSlotBounds[7] - uSlotBounds[6]);
  float lu = clamp((s - uSlotBounds[6]) / span, 0.0015, 0.9985);
  return texture2D(uSlot6, vec2(lu, localV)).rgb;
}

void main() {
  if (uPower <= 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Convert normalized canvas coordinates to master SVG space (1535 x 1024)
  float xSvg = FO_X + vUv.x * FO_W;
  float ySvg = FO_Y + (1.0 - vUv.y) * FO_H;

  if (xSvg < X_MIN - 1.5 || xSvg > X_MAX + 1.5) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float xFrac = (xSvg - X_MIN) / X_SPAN;
  vec2 boundsNorm = decodeLutRow(xFrac, 0.25);
  float yTop = boundsNorm.x * Y_ENCODE_MAX;
  float yBot = boundsNorm.y * Y_ENCODE_MAX;
  float bandH = max(1.0, yBot - yTop);

  // Crisp sub-pixel anti-aliased silhouette mask matching CURVED_BILLBOARD_LED_SCREEN_PATH
  float aa = 0.65;
  float maskL = smoothstep(X_MIN - aa, X_MIN + aa, xSvg);
  float maskR = 1.0 - smoothstep(X_MAX - aa, X_MAX + aa, xSvg);
  float maskT = smoothstep(yTop - aa, yTop + aa, ySvg);
  float maskB = 1.0 - smoothstep(yBot - aa, yBot + aa, ySvg);
  float screenAlpha = maskL * maskR * maskT * maskB;

  if (screenAlpha <= 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // 1. Differential-Geometry Cylindrical Coordinates (uCyl preserves exact native mockup AR; cosTheta drives outer curve shading)
  vec2 cylProps = decodeLutRow(xFrac, 0.75);
  float uCyl = clamp(cylProps.x, 0.0, 1.0);
  float cosTheta = clamp(cylProps.y, 0.08, 1.0);
  float vCyl = clamp((ySvg - yTop) / bandH, 0.0, 1.0);

  // 2. Stationary Physical SMD LED Diode Matrix
  vec2 ledCoord = vec2(uCyl * LED_COLS, vCyl * LED_ROWS);
  vec2 ledIndex = floor(ledCoord);
  vec2 cellLocal = fract(ledCoord) - 0.5;
  vec2 quantizedUv = (ledIndex + 0.5) / vec2(LED_COLS, LED_ROWS);

  vec3 colQuant = sampleVisibleSlotWindow(quantizedUv.x, quantizedUv.y);
  vec3 colSmooth = sampleVisibleSlotWindow(uCyl, vCyl);
  vec3 baseCol = mix(colSmooth, colQuant, 0.16);

  baseCol = pow(clamp(baseCol, 0.0, 1.0), vec3(0.95)) * 1.035;

  vec2 dSquircle = max(abs(cellLocal) - vec2(0.15, 0.15), 0.0);
  float dotDist = length(dSquircle) + 0.34 * length(cellLocal);
  float diodeDot = 1.0 - smoothstep(0.20, 0.44, dotDist);

  vec3 subpixelTint = vec3(
    1.0 + 0.022 * smoothstep(-0.03, -0.24, cellLocal.x),
    1.0 + 0.018 * (1.0 - smoothstep(0.0, 0.20, abs(cellLocal.x))),
    1.0 + 0.022 * smoothstep(0.03, 0.24, cellLocal.x)
  );

  float estCellPx = max(bandH / LED_ROWS, 0.75) * uRenderedScale;
  float gridVisibility = smoothstep(0.72, 1.55, estCellPx);

  float lum = dot(baseCol, vec3(0.299, 0.587, 0.114));
  float louverFloor = mix(0.68, 0.83, smoothstep(0.22, 0.86, lum));
  float peakGain = mix(1.07, 1.03, smoothstep(0.22, 0.86, lum));
  float rawLedFactor = mix(louverFloor, peakGain, diodeDot);
  float ledFactor = mix(1.0, rawLedFactor, gridVisibility);

  vec3 ledCol = baseCol * mix(vec3(1.0), subpixelTint, gridVisibility * diodeDot) * ledFactor;

  // Hairline 1-diode edge-to-edge transition between adjacent My Work mockups
  float sPos = uCyl * uScreenAspectSpan;
  float minDs = abs(sPos - uSlotBounds[1]);
  minDs = min(minDs, abs(sPos - uSlotBounds[2]));
  minDs = min(minDs, abs(sPos - uSlotBounds[3]));
  minDs = min(minDs, abs(sPos - uSlotBounds[4]));
  minDs = min(minDs, abs(sPos - uSlotBounds[5]));
  minDs = min(minDs, abs(sPos - uSlotBounds[6]));
  float interiorMask = smoothstep(0.004, 0.018, uCyl) * smoothstep(0.004, 0.018, 1.0 - uCyl);
  float panelSeamDiodes = (minDs / max(0.1, uScreenAspectSpan)) * LED_COLS;
  float seamShade = mix(1.0, 0.87 + 0.13 * smoothstep(0.0, 1.05, panelSeamDiodes), interiorMask);
  ledCol *= seamShade;

  // 3. Cylindrical View-Angle Depth Shading, Recessed Bezel Contact Shadow, Sky Sheen & Warm Canopy Bounce
  float cylDepthShade = 0.72 + 0.28 * pow(cosTheta, 0.62);

  float distTop = ySvg - yTop;
  float distBot = yBot - ySvg;
  float distLeft = xSvg - X_MIN;
  float distRight = X_MAX - xSvg;
  float bezelTopShade = 0.74 + 0.26 * smoothstep(0.0, 6.0, distTop);
  float bezelBotShade = 0.84 + 0.16 * smoothstep(0.0, 4.2, distBot);
  float bezelSideShade =
    (0.70 + 0.30 * smoothstep(0.0, 11.0, distLeft)) *
    (0.70 + 0.30 * smoothstep(0.0, 11.0, distRight));

  float archSkySheen =
    0.017 *
    exp(-pow((vCyl - 0.15) / 0.14, 2.0)) *
    (0.45 + 0.55 * cosTheta);

  vec3 warmCanopyBounce =
    vec3(1.0, 0.80, 0.50) *
    0.020 *
    exp(-pow((1.0 - vCyl) / 0.13, 2.0)) *
    (0.45 + 0.55 * cosTheta);

  ledCol =
    ledCol * cylDepthShade * bezelTopShade * bezelBotShade * bezelSideShade +
    vec3(archSkySheen) +
    warmCanopyBounce;

  // 4. Smooth Cylindrical Power-On Sweep when Stage 2 Illuminates
  float sweepFront = uEntryReveal * 1.28;
  float revealMask = smoothstep(uCyl - 0.22, uCyl + 0.04, sweepFront);
  if (uEntryReveal >= 0.998) {
    revealMask = 1.0;
  }

  vec3 unlitMatrixCol = vec3(0.043, 0.045, 0.058) * (0.82 + 0.18 * diodeDot);
  vec3 finalRgb = clamp(mix(unlitMatrixCol, ledCol, revealMask), 0.0, 1.0);

  float finalAlpha = screenAlpha * clamp(uPower, 0.0, 1.0);
  gl_FragColor = vec4(finalRgb * finalAlpha, finalAlpha);
}
`;

export interface CurvedLedBillboardRenderer {
  render(
    scrollIndex: number,
    power: number,
    entryReveal: number,
    renderedScale: number
  ): void;
  setPanelImages(images: readonly HTMLImageElement[]): void;
  dispose(): void;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Creates a GPU-accelerated WebGL adaptive multi-format cylindrical LED renderer on `<canvas>`,
 * streaming any number of My Work portfolio mockups seamlessly with a 2D-canvas fallback.
 */
export function createCurvedLedBillboardRenderer(
  canvas: HTMLCanvasElement
): CurvedLedBillboardRenderer {
  const geom = getArchBaseGeometry();
  const cylLut = buildCylindricalLut(SCREEN_CYLINDRICAL_ASPECT_SPAN);
  let tapeMetrics = computePeriodicTapeMetrics(FALLBACK_PANEL_ASPECTS);

  const gl = (canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
  }) ||
    canvas.getContext("experimental-webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    })) as WebGLRenderingContext | null;

  if (gl) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    const prog = gl.createProgram();

    if (vs && fs && prog) {
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );

        const aPosLoc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

        // Upload 1024x2 16-bit Arch Bounds + Cylindrical Arc LUT Texture to Unit 0
        const lutTex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lutTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          LUT_WIDTH,
          LUT_HEIGHT,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          cylLut.lutRgba
        );

        // Fallback 1x1 dark LED texture before images finish decoding
        const placeholderTex = gl.createTexture();
        const placeholderPixel = new Uint8Array([16, 16, 20, 255]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, placeholderTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          placeholderPixel
        );

        let panelTextures: (WebGLTexture | null)[] = [];

        gl.uniform1i(gl.getUniformLocation(prog, "uArchLut"), 0);
        for (let j = 0; j < VISIBLE_SLOT_COUNT; j++) {
          gl.uniform1i(gl.getUniformLocation(prog, `uSlot${j}`), j + 1);
        }

        const uSlotBoundsLoc = gl.getUniformLocation(prog, "uSlotBounds[0]");
        const uScreenSpanLoc = gl.getUniformLocation(prog, "uScreenAspectSpan");
        const uPowerLoc = gl.getUniformLocation(prog, "uPower");
        const uEntryLoc = gl.getUniformLocation(prog, "uEntryReveal");
        const uScaleLoc = gl.getUniformLocation(prog, "uRenderedScale");

        gl.uniform1f(uScreenSpanLoc, cylLut.totalAspectSpan);

        let lastState = {
          scroll: NaN,
          power: NaN,
          entry: NaN,
          scale: NaN,
        };

        return {
          setPanelImages(images: readonly HTMLImageElement[]) {
            if (gl.isContextLost() || images.length === 0) return;
            gl.useProgram(prog);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

            panelTextures.forEach((t) => t && gl.deleteTexture(t));
            panelTextures = [];

            const measuredAspects: number[] = [];
            for (let i = 0; i < images.length; i++) {
              const img = images[i];
              const tex = gl.createTexture();
              gl.activeTexture(gl.TEXTURE1);
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

              if (
                img &&
                img.complete &&
                img.naturalWidth > 0 &&
                img.naturalHeight > 0 &&
                tex
              ) {
                measuredAspects.push(img.naturalWidth / img.naturalHeight);
                const source = prepareUncroppedTextureSource(img);
                gl.texImage2D(
                  gl.TEXTURE_2D,
                  0,
                  gl.RGBA,
                  gl.RGBA,
                  gl.UNSIGNED_BYTE,
                  source
                );
              } else {
                measuredAspects.push(1.0);
                gl.texImage2D(
                  gl.TEXTURE_2D,
                  0,
                  gl.RGBA,
                  1,
                  1,
                  0,
                  gl.RGBA,
                  gl.UNSIGNED_BYTE,
                  placeholderPixel
                );
              }
              panelTextures.push(tex);
            }

            tapeMetrics = computePeriodicTapeMetrics(measuredAspects);
            lastState.scroll = NaN; // Force redraw on next render call
          },

          render(
            scrollIndex: number,
            power: number,
            entryReveal: number,
            renderedScale: number
          ) {
            if (gl.isContextLost()) return;
            if (
              Math.abs(lastState.scroll - scrollIndex) < 1e-4 &&
              Math.abs(lastState.power - power) < 1e-4 &&
              Math.abs(lastState.entry - entryReveal) < 1e-4 &&
              Math.abs(lastState.scale - renderedScale) < 1e-3
            ) {
              return;
            }
            lastState = {
              scroll: scrollIndex,
              power,
              entry: entryReveal,
              scale: renderedScale,
            };

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (power <= 0.002) return;

            const windowFrame = resolveVisibleWindow(scrollIndex, tapeMetrics);

            gl.useProgram(prog);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, lutTex);

            for (let j = 0; j < VISIBLE_SLOT_COUNT; j++) {
              const pIdx = windowFrame.slotPanelIndices[j];
              const tex = panelTextures[pIdx] ?? placeholderTex;
              gl.activeTexture(gl.TEXTURE1 + j);
              gl.bindTexture(gl.TEXTURE_2D, tex);
            }

            gl.uniform1fv(uSlotBoundsLoc, windowFrame.slotBounds);
            gl.uniform1f(uScreenSpanLoc, cylLut.totalAspectSpan);
            gl.uniform1f(uPowerLoc, power);
            gl.uniform1f(uEntryLoc, entryReveal);
            gl.uniform1f(uScaleLoc, Math.max(0.35, renderedScale));

            gl.drawArrays(gl.TRIANGLES, 0, 6);
          },

          dispose() {
            if (gl.isContextLost()) return;
            panelTextures.forEach((t) => t && gl.deleteTexture(t));
            panelTextures = [];
            if (placeholderTex) gl.deleteTexture(placeholderTex);
            if (lutTex) gl.deleteTexture(lutTex);
            if (quadBuf) gl.deleteBuffer(quadBuf);
            gl.deleteProgram(prog);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
          },
        };
      }
    }
  }

  // Clean 2D Canvas Adaptive Multi-Format Cylindrical Strip Fallback
  const ctx2d = canvas.getContext("2d");
  let loadedSources: (HTMLCanvasElement | HTMLImageElement)[] = [];

  return {
    setPanelImages(images: readonly HTMLImageElement[]) {
      const measuredAspects: number[] = [];
      const nextSources: (HTMLCanvasElement | HTMLImageElement)[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          measuredAspects.push(img.naturalWidth / img.naturalHeight);
          nextSources.push(prepareUncroppedTextureSource(img));
        } else {
          measuredAspects.push(1.0);
          if (img) nextSources.push(img);
        }
      }
      loadedSources = nextSources;
      tapeMetrics = computePeriodicTapeMetrics(measuredAspects);
    },
    render(scrollIndex: number, power: number) {
      if (!ctx2d) return;
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      if (power <= 0.002 || loadedSources.length === 0) return;

      const scaleX = canvas.width / LED_FOREIGN_OBJECT_W;
      const scaleY = canvas.height / LED_FOREIGN_OBJECT_H;
      const windowFrame = resolveVisibleWindow(scrollIndex, tapeMetrics);

      ctx2d.save();
      ctx2d.globalAlpha = Math.max(0, Math.min(1, power));

      const strips = 260;
      const stripSvgW = SCREEN_SPAN_X / strips;
      for (let s = 0; s < strips; s++) {
        const f0 = s / strips;
        const f1 = (s + 1) / strips;
        const fMid = 0.5 * (f0 + f1);
        const xSvg = SCREEN_MIN_X + f0 * SCREEN_SPAN_X;

        const lutIdx = Math.min(
          LUT_WIDTH - 1,
          Math.round(fMid * (LUT_WIDTH - 1))
        );
        const yTop = geom.yTopFloat[lutIdx];
        const yBot = geom.yBotFloat[lutIdx];
        const sPos = cylLut.uCylFloat[lutIdx] * cylLut.totalAspectSpan;

        let slotIdx = VISIBLE_SLOT_COUNT - 1;
        for (let j = 0; j < VISIBLE_SLOT_COUNT; j++) {
          if (sPos < windowFrame.slotBounds[j + 1]) {
            slotIdx = j;
            break;
          }
        }
        const span = Math.max(
          1e-4,
          windowFrame.slotBounds[slotIdx + 1] - windowFrame.slotBounds[slotIdx]
        );
        const localU = Math.max(
          0,
          Math.min(0.999, (sPos - windowFrame.slotBounds[slotIdx]) / span)
        );

        const pIdx = windowFrame.slotPanelIndices[slotIdx];
        const src = loadedSources[pIdx];
        const srcW =
          src instanceof HTMLCanvasElement ? src.width : src?.naturalWidth ?? 0;
        const srcH =
          src instanceof HTMLCanvasElement ? src.height : src?.naturalHeight ?? 0;
        if (!src || srcW <= 0 || srcH <= 0) continue;

        const sx = Math.min(srcW - 2, Math.floor(localU * srcW));
        const sw = Math.max(
          2,
          Math.ceil((srcW * cylLut.totalAspectSpan) / (strips * span))
        );
        const dx = (xSvg - LED_FOREIGN_OBJECT_X) * scaleX;
        const dy = (yTop - LED_FOREIGN_OBJECT_Y) * scaleY;
        const dw = stripSvgW * scaleX + 0.9;
        const dh = (yBot - yTop) * scaleY;

        ctx2d.drawImage(src, sx, 0, sw, srcH, dx, dy, dw, dh);
      }
      ctx2d.restore();
    },
    dispose() {
      loadedSources = [];
    },
  };
}
