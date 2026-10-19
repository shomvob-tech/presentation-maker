import type { NextRequest } from "next/server";
import { handleHealth } from "@/lib/hris/api";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Worker and queue health for monitoring; needs a key with the `health` scope. */
export function GET(request: NextRequest) {
  return handleHealth(request);
}
