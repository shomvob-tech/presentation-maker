"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import {
  loadPreviewLogo,
  PRESENTATION_SESSION_KEY,
  type PresentationWizardSession,
} from "@/lib/presentation-session";

const FALLBACK_LOGO = "/resources/300_ltd_logo.svg";

export type ClientLogoSize = "sm" | "md" | "lg";

const SIZE_BOX: Record<ClientLogoSize, string> = {
  sm: "h-8 w-[7.5rem]",
  md: "h-10 w-[8.75rem]",
  lg: "h-12 w-[10rem]",
};

type ClientLogoProps = {
  alt?: string;
  size?: ClientLogoSize;
  className?: string;
};

function readLogoSource() {
  const rawSession = sessionStorage.getItem(PRESENTATION_SESSION_KEY);
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as PresentationWizardSession;
      if (session.logoDataUrl) return session.logoDataUrl;
    } catch {
      // Fall through to preview logo or default.
    }
  }

  const previewLogo = loadPreviewLogo();
  if (previewLogo) return previewLogo;

  return FALLBACK_LOGO;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return readLogoSource();
}

function getServerSnapshot() {
  return FALLBACK_LOGO;
}

export default function ClientLogo({
  alt = "Client logo",
  size = "md",
  className = "",
}: ClientLogoProps) {
  const src = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const boxClassName = [SIZE_BOX[size], className].filter(Boolean).join(" ");

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${boxClassName}`}>
      <Image
        src={src}
        alt={alt}
        width={160}
        height={48}
        data-client-logo
        unoptimized={src.startsWith("data:")}
        className="h-full w-full object-contain object-left"
      />
    </span>
  );
}
