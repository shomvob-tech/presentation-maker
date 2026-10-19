/**
 * Plays HRIS for diagram step 8 (as changed): using ONLY the shared Supabase
 * project (SUPABASE_URL + service key), find the latest ready document for a
 * quotation through the view, check its key, sign a 5-minute URL and fetch it.
 *
 *   npm run test:hris-signed-url -- <clientId> <tenantId> <quotationId>
 *
 * Checks: the view row exists; bucket and key pattern are what HRIS will
 * assert; the signed URL downloads a PDF whose sha256 matches the view; the
 * token's lifetime is exactly 300 s; a 3-second URL stops working; the anon
 * key (if SUPABASE_ANON_KEY is set) can't read the view or the file.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the environment
}

const [clientId, tenantId, quotationId] = process.argv.slice(2);
if (!clientId || !tenantId || !quotationId) {
  console.error("Usage: npm run test:hris-signed-url -- <clientId> <tenantId> <quotationId>");
  process.exit(1);
}

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1. Resolve the object through the view, exactly as the v3 doc tells HRIS to.
const { data: doc, error } = await admin
  .from("pb_hris_documents_latest")
  .select("job_id, version, bucket, object_key, sha256, size_bytes, page_count")
  .eq("client_id", clientId)
  .eq("tenant_id", tenantId)
  .eq("quotation_id", quotationId)
  .eq("doc_type", "proposal")
  .maybeSingle();
assert.ok(!error, error?.message);
assert.ok(doc, "no ready document for that client/tenant/quotation");
const keyPattern = new RegExp(`^documents/${clientId}/${tenantId}/${quotationId}/proposal_v\\d+\\.pdf$`);
assert.equal(doc.bucket, "proposal-pdfs");
assert.match(doc.object_key, keyPattern);
console.log(`  ok  view -> v${doc.version} ${doc.object_key}`);

// 2. Sign for 5 minutes and download.
const signed = await admin.storage
  .from("proposal-pdfs")
  .createSignedUrl(doc.object_key, 300, { download: `proposal-${quotationId}-v${doc.version}.pdf` });
assert.ok(!signed.error, signed.error?.message);
const response = await fetch(signed.data!.signedUrl);
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type") ?? "", /application\/pdf/);
const bytes = Buffer.from(await response.arrayBuffer());
assert.equal(createHash("sha256").update(bytes).digest("hex"), doc.sha256);
console.log(`  ok  300 s signed URL downloads the PDF (${bytes.length} bytes, sha256 matches)`);

// 3. The token lives exactly 300 s.
const token = new URL(signed.data!.signedUrl).searchParams.get("token")!;
const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { iat: number; exp: number };
assert.equal(claims.exp - claims.iat, 300);
console.log("  ok  token exp - iat = 300");

// 4. A short URL stops working.
const short = await admin.storage.from("proposal-pdfs").createSignedUrl(doc.object_key, 3);
assert.ok(!short.error);
await new Promise((resolve) => setTimeout(resolve, 5_000));
const expired = await fetch(short.data!.signedUrl);
assert.notEqual(expired.status, 200);
console.log(`  ok  3 s URL rejected after expiry (HTTP ${expired.status})`);

// 5. The anon key gets nothing.
if (process.env.SUPABASE_ANON_KEY) {
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const view = await anon.from("pb_hris_documents_latest").select("object_key").limit(1);
  assert.ok(view.error, "anon must not read the view");
  const file = await anon.storage.from("proposal-pdfs").download(doc.object_key);
  assert.ok(file.error, "anon must not download");
  console.log("  ok  anon key: no view, no file");
} else {
  console.log("  --  anon checks skipped (SUPABASE_ANON_KEY not set)");
}

console.log("Step 8 check passed.");
