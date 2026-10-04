"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_CLIENT_NAME,
  loadClientName,
} from "@/lib/presentation-session";
import { usePresentationBranding } from "./PresentationBrandingContext";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function useClientName() {
  const { clientName } = usePresentationBranding();
  const storedClientName = useSyncExternalStore(
    subscribe,
    loadClientName,
    () => DEFAULT_CLIENT_NAME,
  );

  return clientName ?? storedClientName;
}
