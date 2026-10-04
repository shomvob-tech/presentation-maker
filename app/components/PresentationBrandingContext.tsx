"use client";

import { createContext, useContext, type ReactNode } from "react";

type PresentationBranding = {
  showClientBranding: boolean;
  useGenericCopy: boolean;
  /**
   * Set by decks that know their client: the presentation builder's preview
   * and the /300ltd sample. Left undefined, useClientName and ClientLogo fall
   * back to the browser storage the parked first wizard wrote
   * (app/_legacy-builder). A deck that sets these never reads that storage,
   * so a rep's old wizard session cannot leak into a new deck.
   */
  clientName?: string;
  /** `null` means "this deck has no client logo", not "look one up". */
  logoSrc?: string | null;
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

export function ClientPresentationBranding({
  clientName,
  logoSrc,
  children,
}: {
  clientName: string;
  logoSrc: string | null;
  children: ReactNode;
}) {
  return (
    <PresentationBrandingContext.Provider
      value={{
        showClientBranding: true,
        useGenericCopy: false,
        clientName,
        logoSrc,
      }}
    >
      {children}
    </PresentationBrandingContext.Provider>
  );
}

export function usePresentationBranding() {
  return useContext(PresentationBrandingContext);
}
