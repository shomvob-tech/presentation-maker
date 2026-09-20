"use client";

/**
 * Biometric device proposal preview — four fixed A4 pages at true print size
 * on a gray backdrop, read back out of localStorage.
 *
 * The cover is the HRIS proposal's CoverPage, unchanged: it already takes a
 * document title, an optional client logo, and an optional prepared-by
 * contact, which is the whole of page 1 in the source proposal. Only pages
 * 2–4 needed device-specific components.
 *
 * Reads through useSyncExternalStore rather than an effect (the SLA preview's
 * pattern) so the pages are present in the first committed render — the export
 * route waits on `.a4-page`, and a second-pass mount is a race it does not
 * need to run.
 */

import Link from "next/link";
import { useSyncExternalStore } from "react";
import CoverPage from "@/app/components/CoverPage";
import DeviceLetter from "@/app/components/device/DeviceLetter";
import DeviceQuotation from "@/app/components/device/DeviceQuotation";
import DeviceTerms from "@/app/components/device/DeviceTerms";
import DevicePrintPdfButton from "@/app/components/device/DevicePrintPdfButton";
import {
  DEVICE_DETAILS_KEY,
  DEVICE_LOGO_KEY,
  loadDeviceDetails,
  loadDeviceLogo,
  type DeviceProposalDetails,
} from "@/lib/device-session";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_logo.png";
const SIGNATURE_SRC = "/resources/hasib_bhai_sig.png";

type PreviewSnapshot = {
  details: DeviceProposalDetails | null;
  logoDataUrl: string | null;
};

const EMPTY_SNAPSHOT: PreviewSnapshot = { details: null, logoDataUrl: null };

function subscribeToDeviceStorage() {
  return () => undefined;
}

let cachedDetailsRaw: string | null | undefined;
let cachedLogoRaw: string | null | undefined;
let cachedSnapshot: PreviewSnapshot = EMPTY_SNAPSHOT;

/** Must return a stable reference while the underlying strings are unchanged,
 * or useSyncExternalStore re-renders forever. */
function getDeviceSnapshot(): PreviewSnapshot {
  const detailsRaw = localStorage.getItem(DEVICE_DETAILS_KEY);
  const logoRaw = localStorage.getItem(DEVICE_LOGO_KEY);

  if (detailsRaw === cachedDetailsRaw && logoRaw === cachedLogoRaw) {
    return cachedSnapshot;
  }

  cachedDetailsRaw = detailsRaw;
  cachedLogoRaw = logoRaw;
  cachedSnapshot = {
    details: loadDeviceDetails(),
    logoDataUrl: loadDeviceLogo(),
  };
  return cachedSnapshot;
}

function PageFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="print-stage flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="print-hide mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        {label}
      </p>
      <div className="print-stage shadow-2xl shadow-black/30">{children}</div>
    </div>
  );
}

export default function DevicePreviewPage() {
  const { details, logoDataUrl } = useSyncExternalStore<PreviewSnapshot>(
    subscribeToDeviceStorage,
    getDeviceSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  if (!details) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e5e5e5] px-6 text-center text-[#0c3d20]">
        <h1 className="text-lg font-semibold">No device proposal to preview</h1>
        <p className="max-w-md text-sm text-[#0c3d20]/70">
          Fill in the device proposal builder first, then continue to preview.
        </p>
        <Link
          href="/device-builder"
          className="rounded-xl bg-[#edb713] px-6 py-3 text-sm font-semibold text-[#0c3d20] transition hover:bg-[#f5c832]"
        >
          Go to device builder
        </Link>
      </main>
    );
  }

  const addresseeName = details.letterAddresseeName?.trim() || details.clientName;
  const hasPreparedBy = Boolean(
    details.preparedByName ||
      details.preparedByTitle ||
      details.preparedByPhone ||
      details.preparedByEmail,
  );

  return (
    <main className="print-stage bg-[#e5e5e5] pt-10">
      <div className="print-hide mx-auto mb-6 flex w-full max-w-[210mm] items-center justify-between px-4 text-sm">
        <Link
          href="/device-builder"
          className="font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Edit device proposal
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
          Device proposal preview
        </span>
      </div>

      <PageFrame label="Cover">
        <CoverPage
          clientName={details.clientName}
          clientLogoSrc={logoDataUrl ?? undefined}
          documentTitle={details.documentTitle}
          preparedDate={details.preparedDate}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
          preparedBy={
            hasPreparedBy
              ? {
                  name: details.preparedByName,
                  title: details.preparedByTitle,
                  phone: details.preparedByPhone,
                  email: details.preparedByEmail,
                }
              : undefined
          }
        />
      </PageFrame>

      <PageFrame label="Letter from COO">
        <DeviceLetter
          clientName={details.clientName}
          addresseeName={addresseeName}
          recipientName={details.recipientName}
          recipientTitle={details.recipientTitle}
          preparedDate={details.preparedDate}
          keyBenefits={details.keyBenefits}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
          signatureSrc={SIGNATURE_SRC}
        />
      </PageFrame>

      <PageFrame label="Quotation">
        <DeviceQuotation
          clientName={details.clientName}
          addresseeName={addresseeName}
          lineItems={details.lineItems}
          vatPercent={details.vatPercent}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </PageFrame>

      <PageFrame label="Terms and Conditions">
        <DeviceTerms
          clientName={details.clientName}
          warrantyPeriod={details.warrantyPeriod}
          paymentTerms={details.paymentTerms}
          deliveryCity={details.deliveryCity}
          deliveryLeadTime={details.deliveryLeadTime}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </PageFrame>

      <DevicePrintPdfButton details={details} />
    </main>
  );
}
