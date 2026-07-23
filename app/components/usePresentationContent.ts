"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parsePresentationContent,
  PRESENTATION_CONTENT_SESSION_KEY,
  PREVIEW_CONTENT_KEY,
} from "@/lib/presentation-content-storage";
import type { ModuleSlideContent, PresentationContent } from "@/lib/presentation-content";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return (
    sessionStorage.getItem(PRESENTATION_CONTENT_SESSION_KEY) ??
    localStorage.getItem(PREVIEW_CONTENT_KEY)
  );
}

function getServerSnapshot() {
  return null;
}

export function usePresentationContent(): PresentationContent | null {
  const serializedContent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () => parsePresentationContent(serializedContent),
    [serializedContent],
  );
}

export function useModuleSlideContent(
  moduleId: string,
): ModuleSlideContent | null {
  const content = usePresentationContent();
  return content?.modules[moduleId] ?? null;
}
