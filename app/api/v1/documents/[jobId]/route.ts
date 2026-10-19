import type { NextRequest } from "next/server";
import { handleGetDocument, handleOptions } from "@/lib/hris/api";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Diagram step 7: the job's current state, for HRIS's safety-net cron. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  return handleGetDocument(request, jobId);
}

export function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}
