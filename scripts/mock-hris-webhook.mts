/**
 * A stand-in for HRIS's webhook receiver (diagram step 6), for local tests.
 *
 *   npm run hris:mock-webhook -- --port 4000 [--secret whsec_…] [--fail-first N]
 *                                [--status CODE] [--delay-ack MS]
 *
 * Verifies each POST with its OWN copy of the HRIS sample from
 * docs/hris-documents-api-v3.md (not the server's signing code), enforces
 * ±300 s on the timestamp and dedupes on webhook-id, exactly as HRIS should.
 *
 * Answers: 401 on a bad signature; 204 for a duplicate; otherwise --status
 * (default 204), or 503 for the first --fail-first N valid deliveries.
 * GET /events returns everything received, for test scripts to assert on.
 * --secret defaults to HRIS_TEST_WEBHOOK_SECRET from .env.local.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const port = Number(option("--port") ?? 4000);
const secret = option("--secret") ?? process.env.HRIS_TEST_WEBHOOK_SECRET ?? "";
let failFirst = Number(option("--fail-first") ?? 0);
const forcedStatus = Number(option("--status") ?? 204);
const delayAckMs = Number(option("--delay-ack") ?? 0);

if (!secret) {
  console.error("No secret: pass --secret or set HRIS_TEST_WEBHOOK_SECRET.");
  process.exit(1);
}

// ── HRIS sample, copied verbatim from the v3 doc ──────────────────────────
function verifyProposalBuilderWebhook(
  rawBody: string,
  h: { id?: string; timestamp?: string; signature?: string },
  secret: string,
  toleranceSec = 300,
): boolean {
  if (!h.id || !h.timestamp || !h.signature) return false;
  const t = Number(h.timestamp);
  if (!Number.isInteger(t) || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", key).update(`${h.id}.${h.timestamp}.${rawBody}`).digest();
  return h.signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
// ──────────────────────────────────────────────────────────────────────────

type Received = {
  eventId: string;
  type: string;
  jobId: string | null;
  version: number | null;
  status: string | null;
  sha256: string | null;
  verified: boolean;
  duplicate: boolean;
  timestamp: string | null;
  body: string;
  answered: number;
  at: string;
};

const seen = new Set<string>();
const received: Received[] = [];

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/events") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(received));
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405).end();
    return;
  }

  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    const rawBody = Buffer.concat(chunks).toString("utf8");
    const headers = {
      id: req.headers["webhook-id"] as string | undefined,
      timestamp: req.headers["webhook-timestamp"] as string | undefined,
      signature: req.headers["webhook-signature"] as string | undefined,
    };
    const verified = verifyProposalBuilderWebhook(rawBody, headers, secret);

    let parsed: { type?: string; data?: { jobId?: string; version?: number; status?: string; document?: { sha256?: string } } } = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      // keep empty
    }

    const duplicate = verified && !!headers.id && seen.has(headers.id);
    let answered: number;
    if (!verified) answered = 401;
    else if (duplicate) answered = 204;
    else if (failFirst > 0) {
      failFirst--;
      answered = 503;
    } else {
      answered = forcedStatus;
      if (answered >= 200 && answered < 300 && headers.id) seen.add(headers.id);
    }

    const entry: Received = {
      eventId: headers.id ?? "",
      type: parsed.type ?? "",
      jobId: parsed.data?.jobId ?? null,
      version: parsed.data?.version ?? null,
      status: parsed.data?.status ?? null,
      sha256: parsed.data?.document?.sha256 ?? null,
      verified,
      duplicate,
      timestamp: headers.timestamp ?? null,
      body: rawBody,
      answered,
      at: new Date().toISOString(),
    };
    received.push(entry);
    const { body: _body, ...printable } = entry;
    void _body;
    console.log(JSON.stringify(printable));

    setTimeout(() => res.writeHead(answered).end(), delayAckMs);
  });
});

server.listen(port, () => console.log(`[mock-hris-webhook] listening on http://localhost:${port}/hook`));
