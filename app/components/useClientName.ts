"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_CLIENT_NAME,
  loadClientName,
} from "@/lib/presentation-session";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function useClientName() {
  return useSyncExternalStore(
    subscribe,
    loadClientName,
    () => DEFAULT_CLIENT_NAME,
  );
}
