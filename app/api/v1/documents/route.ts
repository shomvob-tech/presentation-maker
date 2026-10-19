import type { NextRequest } from "next/server";
import { handleCreateDocument, handleOptions } from "@/lib/hris/api";

// node:crypto and the Supabase client — this cannot run on the Edge runtime.
export const runtime = "nodejs";

// Only validates and enqueues; the PDF is built by the worker.
export const maxDuration = 30;

/** Diagram steps 2-3: accept a document request, reply 202 with its jobId. */
export function POST(request: NextRequest) {
  return handleCreateDocument(request);
}

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}
