"use client";

import { createContext, useContext, type ReactNode } from "react";

type PresentationBranding = {
  showClientBranding: boolean;
  useGenericCopy: boolean;
};

const PresentationBrandingContext = createContext<PresentationBranding>({
  showClientBranding: true,
  useGenericCopy: false,
});

export function GenericPresentationBranding({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PresentationBrandingContext.Provider
      value={{ showClientBranding: false, useGenericCopy: true }}
    >
      {children}
    </PresentationBrandingContext.Provider>
  );
}

export function usePresentationBranding() {
  return useContext(PresentationBrandingContext);
}
