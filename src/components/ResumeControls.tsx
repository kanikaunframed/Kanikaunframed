import React, { createContext, useContext } from "react";
import { Eye, Download } from "lucide-react";

// Normalize base path so /Kanika%20Agrawal_Resume.pdf resolves reliably in dev, preview, and production deployments
const RAW_BASE_URL =
  (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
const NORMALIZED_BASE_URL = RAW_BASE_URL.replace(/\/?$/, "/");

// Single source of truth pointing directly to /public/Kanika Agrawal_Resume.pdf
export const RESUME_PUBLIC_FILENAME = "Kanika Agrawal_Resume.pdf";
export const RESUME_DOWNLOAD_FILENAME = "Kanika_Agrawal_Resume.pdf";
export const RESUME_DOCUMENT_TITLE = "Kanika Agrawal — Resume";
export const RESUME_ASSET_URL = `${NORMALIZED_BASE_URL}${encodeURIComponent(
  RESUME_PUBLIC_FILENAME
)}`;

export interface ResumePreviewContextValue {
  openResumePreview: (triggerEl?: HTMLElement | null) => void;
  warmUpResumePreview?: () => void;
}

export const ResumePreviewContext = createContext<ResumePreviewContextValue>({
  openResumePreview: () => {
    if (typeof window !== "undefined") {
      window.location.assign(RESUME_ASSET_URL);
    }
  },
});

export function useResumePreview() {
  return useContext(ResumePreviewContext);
}

interface ResumeControlsProps {
  className?: string;
}

export function ResumeControls({ className = "" }: ResumeControlsProps) {
  const { openResumePreview, warmUpResumePreview } = useResumePreview();

  const handleViewResumeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    openResumePreview(e.currentTarget);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}
    >
      <button
        type="button"
        onClick={handleViewResumeClick}
        onMouseEnter={warmUpResumePreview}
        onFocus={warmUpResumePreview}
        aria-label="View Resume"
        aria-haspopup="dialog"
        data-resume-action="preview"
        className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-zinc-900 text-white text-xs sm:text-sm font-medium tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-zinc-800 hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)] active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        <Eye
          size={16}
          className="text-white/90 transition-transform duration-300 group-hover:scale-110"
        />
        <span>View Resume</span>
      </button>

      <a
        href={RESUME_ASSET_URL}
        download={RESUME_DOWNLOAD_FILENAME}
        aria-label="Download Resume"
        data-resume-action="download"
        style={{ WebkitBackdropFilter: "blur(24px)" }}
        className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white/80 backdrop-blur-xl text-zinc-900 border border-black/10 text-xs sm:text-sm font-medium tracking-wide shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:bg-white hover:border-black/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        <Download
          size={16}
          className="text-zinc-700 transition-transform duration-300 group-hover:-translate-y-0.5"
        />
        <span>Download Resume</span>
      </a>
    </div>
  );
}
