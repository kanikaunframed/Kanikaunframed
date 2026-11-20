import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import {
  RESUME_ASSET_URL,
  RESUME_DOWNLOAD_FILENAME,
  RESUME_DOCUMENT_TITLE,
} from "./ResumeControls";

const PDF_WORKER_URL = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let cachedPdfJsModulePromise: Promise<PdfJsModule> | null = null;
let cachedPdfBytesPromise: Promise<Uint8Array> | null = null;
let cachedPdfDocPromise: Promise<PDFDocumentProxy> | null = null;

function loadPdfJsModule(): Promise<PdfJsModule> {
  if (!cachedPdfJsModulePromise) {
    cachedPdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs").then(
      (mod) => {
        if (mod.GlobalWorkerOptions.workerSrc !== PDF_WORKER_URL) {
          mod.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        }
        return mod;
      }
    );
  }
  return cachedPdfJsModulePromise;
}

async function fetchResumeBytes(forceReload = false): Promise<Uint8Array> {
  if (forceReload || !cachedPdfBytesPromise) {
    cachedPdfBytesPromise = fetch(RESUME_ASSET_URL, {
      credentials: "same-origin",
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch resume PDF (HTTP ${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Verify PDF %PDF- header so SPA HTML fallbacks never fail silently
      if (
        bytes.byteLength < 5 ||
        bytes[0] !== 0x25 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x44 ||
        bytes[3] !== 0x46
      ) {
        throw new Error("Invalid PDF header received for resume document");
      }
      return bytes;
    });
  }
  return cachedPdfBytesPromise;
}

/**
 * Pre-fetches and parses the centralised resume PDF in the background so opening
 * the in-website previewer feels instantaneous on both Chrome and Safari.
 */
export function warmUpResumePdfDocument(
  forceReload = false
): Promise<{ pdfjs: PdfJsModule; doc: PDFDocumentProxy }> {
  if (forceReload) {
    cachedPdfBytesPromise = null;
    cachedPdfDocPromise = null;
  }

  return Promise.all([loadPdfJsModule(), fetchResumeBytes(forceReload)]).then(
    async ([pdfjs, rawBytes]) => {
      if (!cachedPdfDocPromise) {
        // Pass a fresh slice so PDF.js worker transfer never detaches the cached ArrayBuffer
        const dataCopy = rawBytes.slice(0);
        const loadingTask = pdfjs.getDocument({
          data: dataCopy,
          enableXfa: false,
        });
        cachedPdfDocPromise = loadingTask.promise.catch((err) => {
          cachedPdfDocPromise = null;
          throw err;
        });
      }
      const doc = await cachedPdfDocPromise;
      return { pdfjs, doc };
    }
  );
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.2;
const MAX_FIT_PAGE_WIDTH_PX = 820;
const IOS_SAFE_MAX_CANVAS_PIXELS = 12_500_000;

interface ResumePdfPageSheetProps {
  pdfjs: PdfJsModule;
  page: PDFPageProxy;
  pageNumber: number;
  baseWidthPx: number;
  zoom: number;
  onPageVisible?: (pageNumber: number) => void;
}

const ResumePdfPageSheet: React.FC<ResumePdfPageSheetProps> = ({
  pdfjs,
  page,
  pageNumber,
  baseWidthPx,
  zoom,
  onPageVisible,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const unscaledViewport = page.getViewport({ scale: 1 });
  const targetCssWidth = Math.max(240, Math.round(baseWidthPx * zoom));
  const cssScale = targetCssWidth / Math.max(1, unscaledViewport.width);
  const viewport = page.getViewport({ scale: cssScale });
  const cssWidth = Math.round(viewport.width);
  const cssHeight = Math.round(viewport.height);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el || !onPageVisible || typeof IntersectionObserver === "undefined") {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            onPageVisible(pageNumber);
          }
        }
      },
      { threshold: [0.45, 0.75] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onPageVisible, pageNumber]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const textLayerEl = textLayerRef.current;
    if (!canvasEl) return;

    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let textLayerInstance: InstanceType<PdfJsModule["TextLayer"]> | null = null;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    // Supersample slightly for razor-sharp typography while respecting iOS Safari's 16MP canvas ceiling
    const desiredPixelScale = Math.min(Math.max(dpr * 1.35, 1.5), 3);
    const maxAllowedScale = Math.sqrt(
      IOS_SAFE_MAX_CANVAS_PIXELS / Math.max(1, viewport.width * viewport.height)
    );
    const outputScale = Math.max(1, Math.min(desiredPixelScale, maxAllowedScale));

    canvasEl.width = Math.floor(viewport.width * outputScale);
    canvasEl.height = Math.floor(viewport.height * outputScale);
    canvasEl.style.width = `${cssWidth}px`;
    canvasEl.style.height = `${cssHeight}px`;

    const transform =
      outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : undefined;

    renderTask = page.render({
      canvas: canvasEl,
      viewport,
      transform,
      annotationMode: pdfjs.AnnotationMode.ENABLE,
    });

    renderTask.promise
      .then(() => {
        if (!cancelled) {
          setIsRendered(true);
        }
      })
      .catch((err: unknown) => {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name?: string }).name === "RenderingCancelledException"
        ) {
          return;
        }
      });

    if (textLayerEl) {
      textLayerEl.innerHTML = "";
      pdfjs.setLayerDimensions(textLayerEl, viewport);
      textLayerEl.style.setProperty(
        "--total-scale-factor",
        String(viewport.scale)
      );
      textLayerInstance = new pdfjs.TextLayer({
        textContentSource: page.streamTextContent(),
        container: textLayerEl,
        viewport,
      });
      textLayerInstance.render().catch(() => {
        // Ignore cancelled text layer render during rapid zoom updates
      });
    }

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancel error
        }
      }
      if (textLayerInstance) {
        try {
          textLayerInstance.cancel();
        } catch {
          // Ignore cancel error
        }
      }
    };
  }, [pdfjs, page, viewport.scale, cssWidth, cssHeight]);

  return (
    <div
      ref={sheetRef}
      data-pdf-page={pageNumber}
      style={{ width: `${cssWidth}px`, height: `${cssHeight}px` }}
      className="relative mx-auto bg-white rounded-sm shadow-[0_12px_40px_-10px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.06] overflow-hidden shrink-0 transition-[box-shadow] duration-200"
    >
      {!isRendered && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100/70 to-zinc-50 animate-pulse z-10"
        />
      )}
      <canvas
        ref={canvasRef}
        data-resume-pdf-canvas={pageNumber}
        className="block w-full h-full select-none"
      />
      <div
        ref={textLayerRef}
        data-resume-pdf-text-layer={pageNumber}
        className="resume-pdf-text-layer"
      />
    </div>
  );
};

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResumePreviewModal({
  isOpen,
  onClose,
}: ResumePreviewModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollStageRef = useRef<HTMLDivElement | null>(null);

  const [pdfEngine, setPdfEngine] = useState<{
    pdfjs: PdfJsModule;
    pages: PDFPageProxy[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [stageInnerWidth, setStageInnerWidth] = useState(760);

  const loadDocument = useCallback((forceReload = false) => {
    setIsLoading(true);
    setLoadError(null);

    warmUpResumePdfDocument(forceReload)
      .then(async ({ pdfjs, doc }) => {
        const loadedPages: PDFPageProxy[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const p = await doc.getPage(i);
          loadedPages.push(p);
        }
        setPdfEngine({ pdfjs, pages: loadedPages });
        setCurrentPage(1);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to render the resume preview in this browser.";
        setLoadError(msg);
        setIsLoading(false);
      });
  }, []);

  // Load PDF document when modal opens (resetting zoom to clean 100% fit)
  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setCurrentPage(1);
    if (!pdfEngine) {
      loadDocument(false);
    }
  }, [isOpen, pdfEngine, loadDocument]);

  // Measure available stage width for responsive mobile/tablet/desktop fit
  useEffect(() => {
    if (!isOpen) return;
    const stageEl = scrollStageRef.current;
    if (!stageEl) return;

    const updateWidth = () => {
      const horizontalPadding = window.innerWidth < 640 ? 24 : 56;
      const measured = Math.max(
        260,
        Math.min(MAX_FIT_PAGE_WIDTH_PX, stageEl.clientWidth - horizontalPadding)
      );
      setStageInnerWidth(measured);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(stageEl);
    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) =>
      Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100)
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) =>
      Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100)
    );
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Focus management & keyboard shortcuts (Escape to close, +/-/0 zoom, Tab focus containment)
  useEffect(() => {
    if (!isOpen) return;

    const rafId = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        handleZoomIn();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        handleZoomReset();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleZoomReset]);

  if (typeof document === "undefined") return null;

  const numPages = pdfEngine?.pages.length ?? 0;
  const zoomPercentage = Math.round(zoom * 100);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="resume-preview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          data-testid="resume-preview-backdrop"
          className="fixed inset-0 z-[160] bg-zinc-950/55 flex items-center justify-center p-2.5 sm:p-5 md:p-7"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={RESUME_DOCUMENT_TITLE}
            data-testid="resume-preview-modal"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.97, y: 12 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 8 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.26,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1060px] h-[92dvh] sm:h-[90dvh] bg-[#F5F5F7] rounded-2xl sm:rounded-3xl border border-white/70 shadow-[0_32px_90px_-16px_rgba(0,0,0,0.42)] flex flex-col overflow-hidden"
          >
            {/* Top Studio Document Toolbar */}
            <header
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
              className="relative z-20 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-3 sm:py-3.5 bg-white/90 border-b border-black/[0.07] shrink-0"
            >
              {/* Left: Document Title & Page Indicator */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  aria-hidden="true"
                  className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900/[0.05] text-zinc-800 shrink-0"
                >
                  <FileText size={16} className="stroke-[1.8]" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-900 truncate whitespace-nowrap">
                    {RESUME_DOCUMENT_TITLE}
                  </h2>
                  {numPages > 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="hidden md:inline text-zinc-300"
                      >
                        ·
                      </span>
                      <span
                        data-testid="resume-page-indicator"
                        className="hidden md:inline text-xs text-zinc-500 font-normal tabular-nums whitespace-nowrap shrink-0"
                      >
                        {numPages === 1
                          ? "1 Page"
                          : `Page ${currentPage} of ${numPages}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Zoom Controls, Open in New Tab, Download PDF & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                {/* Zoom Segmented Control */}
                <div
                  role="group"
                  aria-label="Zoom controls"
                  className="inline-flex items-center bg-zinc-900/[0.04] border border-black/[0.06] rounded-full p-0.5"
                >
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= MIN_ZOOM + 0.01}
                    aria-label="Zoom out"
                    data-testid="resume-zoom-out"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-700 hover:text-zinc-950 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    <ZoomOut size={15} className="stroke-[1.9]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomReset}
                    aria-label="Reset zoom to 100%"
                    data-testid="resume-zoom-level"
                    className="px-2 sm:px-2.5 h-8 text-[11px] sm:text-xs font-medium text-zinc-700 hover:text-zinc-950 tabular-nums whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-full"
                  >
                    {zoomPercentage}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= MAX_ZOOM - 0.01}
                    aria-label="Zoom in"
                    data-testid="resume-zoom-in"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-zinc-700 hover:text-zinc-950 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    <ZoomIn size={15} className="stroke-[1.9]" />
                  </button>
                </div>

                {/* Explicit Open PDF in New Tab Action */}
                <a
                  href={RESUME_ASSET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open resume PDF in new tab"
                  data-testid="resume-open-new-tab"
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-full bg-white text-zinc-800 border border-black/10 text-xs font-medium hover:bg-zinc-50 hover:border-black/20 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                >
                  <ExternalLink size={14} className="stroke-[1.9] shrink-0" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>

                {/* Direct Download PDF Action */}
                <a
                  href={RESUME_ASSET_URL}
                  download={RESUME_DOWNLOAD_FILENAME}
                  aria-label="Download resume PDF"
                  data-testid="resume-download-pdf"
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 sm:px-4 rounded-full bg-zinc-900 text-white text-xs font-medium shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
                >
                  <Download size={14} className="stroke-[1.9] shrink-0" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>

                {/* Close Modal Button */}
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close resume preview"
                  data-testid="resume-close-button"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/[0.05] text-zinc-700 hover:bg-zinc-900/[0.1] hover:text-zinc-950 active:scale-95 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                >
                  <X size={17} className="stroke-[2]" />
                </button>
              </div>
            </header>

            {/* Scrollable Document Viewport */}
            <div
              ref={scrollStageRef}
              data-testid="resume-scroll-stage"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onClose();
                }
              }}
              style={{ WebkitOverflowScrolling: "touch" }}
              className="relative flex-1 w-full overflow-auto px-3 sm:px-7 py-5 sm:py-8"
            >
              {isLoading && !pdfEngine && !loadError && (
                <div
                  data-testid="resume-loading-state"
                  style={{
                    width: `${stageInnerWidth}px`,
                    aspectRatio: "595.28 / 841.89",
                  }}
                  className="mx-auto max-w-full bg-white rounded-sm shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] flex flex-col items-center justify-center gap-3 p-8"
                >
                  <div className="w-7 h-7 rounded-full border-2 border-zinc-200 border-t-zinc-800 animate-spin" />
                  <p className="text-xs font-medium text-zinc-500 tracking-wide">
                    Preparing high-resolution resume preview…
                  </p>
                </div>
              )}

              {loadError && (
                <div
                  data-testid="resume-error-fallback"
                  className="mx-auto my-8 max-w-md bg-white rounded-2xl border border-black/[0.08] shadow-sm p-6 sm:p-8 text-center flex flex-col items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Unable to display inline preview
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      You can still open or download Kanika Agrawal&apos;s
                      resume directly below.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => loadDocument(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw size={13} />
                      <span>Retry Preview</span>
                    </button>
                    <a
                      href={RESUME_ASSET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-black/15 hover:border-black/25 text-zinc-900 text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      <ExternalLink size={13} />
                      <span>Open in New Tab</span>
                    </a>
                    <a
                      href={RESUME_ASSET_URL}
                      download={RESUME_DOWNLOAD_FILENAME}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {pdfEngine && !loadError && (
                <div className="flex flex-col items-center gap-6 sm:gap-8 min-w-fit mx-auto pb-4">
                  {pdfEngine.pages.map((page, index) => (
                    <ResumePdfPageSheet
                      key={`resume-page-${index + 1}`}
                      pdfjs={pdfEngine.pdfjs}
                      page={page}
                      pageNumber={index + 1}
                      baseWidthPx={stageInnerWidth}
                      zoom={zoom}
                      onPageVisible={setCurrentPage}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
