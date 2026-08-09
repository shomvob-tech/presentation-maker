/**
 * Server-side knowledge base parsed from notes-plans/module_list.md.
 *
 * Do NOT import this module from client components — it uses Node `fs` and
 * will fail in the browser bundle. Use from server components, route handlers,
 * or other server-only lib code.
 *
 * Separate from lib/module-recommendation.ts, which matches against
 * knowledge_base.json for the existing presentation wizard. Consolidate later
 * if / when the proposal builder adopts one matching path.
 */

import fs from "node:fs";
import path from "node:path";

export type ModuleFeature = {
  feature: string;
  platform: "Web" | "Mobile App";
};

export type ModuleDefinition = {
  name: string;
  features: ModuleFeature[];
};

function normalizePlatform(value: string): ModuleFeature["platform"] | null {
  const trimmed = value.trim();
  if (trimmed === "Web" || trimmed === "Mobile App") {
    return trimmed;
  }
  return null;
}

/** Parses the Module · Feature · Platform markdown export into typed modules. */
export function parseModuleListMarkdown(markdown: string): ModuleDefinition[] {
  const modules: ModuleDefinition[] = [];
  const lines = markdown.split(/\r?\n/);

  let current: ModuleDefinition | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const headingMatch = /^##\s+(.+)$/.exec(line);
    if (headingMatch) {
      current = { name: headingMatch[1].trim(), features: [] };
      modules.push(current);
      continue;
    }

    if (!current) continue;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    if (/^\|\s*Feature\s*\|/i.test(line)) continue;

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length < 2) continue;

    const [feature, platformRaw] = cells;
    const platform = normalizePlatform(platformRaw);
    if (!platform) continue;

    current.features.push({ feature, platform });
  }

  return modules;
}

function loadModulesFromDisk(): ModuleDefinition[] {
  const filePath = path.join(process.cwd(), "notes-plans", "module_list.md");
  const markdown = fs.readFileSync(filePath, "utf8");
  return parseModuleListMarkdown(markdown);
}

export const MODULES: ModuleDefinition[] = loadModulesFromDisk();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
}

/**
 * Case-insensitive keyword match of requirements (and optional notes) against
 * module names and feature text. Returns module names sorted by hit count.
 */
export function matchModulesFromKeywords(
  requirements: string,
  notes?: string,
): string[] {
  const words = tokenize(`${requirements} ${notes ?? ""}`);
  if (words.length === 0) return [];

  const scored = MODULES.map((mod) => {
    let score = 0;
    const haystacks = [
      mod.name.toLowerCase(),
      ...mod.features.map((feature) => feature.feature.toLowerCase()),
    ];

    for (const word of words) {
      for (const hay of haystacks) {
        if (hay.includes(word)) {
          score += 1;
        }
      }
    }

    return { name: mod.name, score };
  })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name),
    );

  return scored.map((entry) => entry.name);
}
