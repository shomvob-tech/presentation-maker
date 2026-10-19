/**
 * Versioned PDF storage for the HRIS API: Supabase Storage for the file,
 * `public.pb_hris_documents` for the row. Schema and bucket are created by
 * supabase/pb_hris_documents.sql.
 *
 * SERVER ONLY — reads the service-role key, which bypasses RLS. Never import
 * this from a "use client" module.
 *
 * Nothing is ever overwritten. Each save for a (company, doc type) takes the
 * next version number and lands at
 *
 *     hris/{companyId}/{docType}_v{version}.pdf
 *
 * Two requests for the same company can race for the same number. The upload
 * is the lock: it runs with `upsert: false`, so the loser gets a conflict and
 * moves on to the next number. The unique (company_id, doc_type, version)
 * constraint backs that up for the row.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const HRIS_BUCKET = "proposal-pdfs";
const TABLE = "pb_hris_documents";
const MAX_VERSION_ATTEMPTS = 5;

export type HrisDocType = "proposal";

export type StoredDocument = {
  id: string;
  companyId: string;
  docType: HrisDocType;
  version: number;
  path: string;
  url: string;
  pageCount: number;
  sizeBytes: number;
  createdAt: string;
};

let cachedClient: SupabaseClient | null = null;

function supabaseUrl(): string | null {
  return process.env.SUPABASE_URL?.trim().replace(/\/+$/, "") || null;
}

export function isStorageConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_KEY?.trim());
}

function getClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must both be set.");
  }

  cachedClient ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

function storagePath(companyId: string, docType: HrisDocType, version: number): string {
  return `hris/${companyId}/${docType}_v${version}.pdf`;
}

/**
 * The bucket is private, so this URL only works with a valid key for the
 * project (an `Authorization: Bearer` header). It's stored so HRIS can fetch
 * the file without rebuilding the path itself.
 */
function authenticatedUrl(path: string): string {
  return `${supabaseUrl()}/storage/v1/object/authenticated/${HRIS_BUCKET}/${path}`;
}

function isUploadConflict(error: { message: string; status?: number; statusCode?: string }) {
  // Older Storage versions answer 400 with statusCode "409"; newer ones 409.
  return (
    error.status === 409 ||
    error.statusCode === "409" ||
    /already exists|duplicate/i.test(error.message)
  );
}

async function latestVersion(
  client: SupabaseClient,
  companyId: string,
  docType: HrisDocType,
): Promise<number> {
  const { data, error } = await client
    .from(TABLE)
    .select("version")
    .eq("company_id", companyId)
    .eq("doc_type", docType)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not read existing versions: ${error.message}`);
  return data?.version ?? 0;
}

export async function saveVersionedPdf(input: {
  companyId: string;
  docType: HrisDocType;
  clientName: string;
  pdf: Buffer;
  pageCount: number;
  /** What the PDF was rendered from — stored so it can be audited or re-rendered. */
  renderInput: Record<string, unknown>;
  requestedBy?: string;
}): Promise<StoredDocument> {
  const client = getClient();
  const appVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  let version = (await latestVersion(client, input.companyId, input.docType)) + 1;

  for (let attempt = 0; attempt < MAX_VERSION_ATTEMPTS; attempt++, version++) {
    const path = storagePath(input.companyId, input.docType, version);

    const upload = await client.storage.from(HRIS_BUCKET).upload(path, input.pdf, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (upload.error) {
      if (isUploadConflict(upload.error)) continue;
      throw new Error(`Upload failed: ${upload.error.message}`);
    }

    const url = authenticatedUrl(path);
    const insert = await client
      .from(TABLE)
      .insert({
        company_id: input.companyId,
        doc_type: input.docType,
        version,
        client_name: input.clientName,
        storage_path: path,
        pdf_url: url,
        input: input.renderInput,
        size_bytes: input.pdf.byteLength,
        page_count: input.pageCount,
        app_version: appVersion,
        requested_by: input.requestedBy ?? null,
      })
      .select("id, created_at")
      .single();

    if (insert.error) {
      // Don't leave a file behind with no row pointing at it.
      await client.storage.from(HRIS_BUCKET).remove([path]);
      // 23505 = unique violation: a row for this version exists without its
      // file (e.g. deleted by hand). Skip the number rather than fail.
      if (insert.error.code === "23505") continue;
      throw new Error(`Could not save the document row: ${insert.error.message}`);
    }

    return {
      id: insert.data.id,
      companyId: input.companyId,
      docType: input.docType,
      version,
      path,
      url,
      pageCount: input.pageCount,
      sizeBytes: input.pdf.byteLength,
      createdAt: insert.data.created_at,
    };
  }

  throw new Error(
    `Could not allocate a version number after ${MAX_VERSION_ATTEMPTS} attempts.`,
  );
}
