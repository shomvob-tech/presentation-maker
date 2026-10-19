/**
 * Deletes objects under a prefix in the proposal-pdfs bucket — for test data
 * and retired prefixes only (plan §3.6). Dry run unless --apply.
 *
 *   npm run hris:cleanup-objects -- --prefix quotations/            (dry run)
 *   npm run hris:cleanup-objects -- --prefix quotations/ --apply
 *
 * Never deletes an object that a pb_hris_document_jobs row points at (those
 * are HRIS documents). Uses the Storage API, never `delete from
 * storage.objects`, so the files themselves are removed.
 */

import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the environment
}

const args = process.argv.slice(2);
const prefixIndex = args.indexOf("--prefix");
const prefix = prefixIndex >= 0 ? args[prefixIndex + 1]?.replace(/\/+$/, "") : undefined;
const apply = args.includes("--apply");
if (!prefix) {
  console.error("Usage: npm run hris:cleanup-objects -- --prefix <prefix>/ [--apply]");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = supabase.storage.from("proposal-pdfs");

async function listAll(path: string): Promise<string[]> {
  const names: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket.list(path, { limit: 100, offset });
    if (error) throw new Error(`list ${path}: ${error.message}`);
    for (const entry of data) {
      const full = `${path}/${entry.name}`;
      if (entry.id === null) names.push(...(await listAll(full)));
      else names.push(full);
    }
    if (data.length < 100) break;
  }
  return names;
}

/** Keys referenced by a job; none if the table doesn't exist yet. */
async function referencedKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("pb_hris_document_jobs").select("object_key").range(from, from + 999);
    if (error) {
      if (["PGRST205", "42P01"].includes(error.code ?? "")) return keys;
      throw new Error(`jobs: ${error.message}`);
    }
    for (const row of data) keys.add(row.object_key as string);
    if (data.length < 1000) return keys;
  }
}

const referenced = await referencedKeys();
const all = await listAll(prefix);
const deletable = all.filter((name) => !referenced.has(name));
const skipped = all.length - deletable.length;

console.log(`${all.length} object(s) under ${prefix}/; ${skipped} referenced by a job (kept); ${deletable.length} to delete.`);
for (const name of deletable.slice(0, 20)) console.log(`  ${name}`);
if (deletable.length > 20) console.log(`  … and ${deletable.length - 20} more`);

if (!apply) {
  console.log("Dry run. Re-run with --apply to delete.");
  process.exit(0);
}

let deleted = 0;
for (let i = 0; i < deletable.length; i += 100) {
  const batch = deletable.slice(i, i + 100);
  const { error } = await bucket.remove(batch);
  if (error) throw new Error(`remove: ${error.message}`);
  deleted += batch.length;
}
console.log(`Deleted ${deleted} object(s).`);
