# Implementation Plan — Proposal Inputs, Session Storage, Knowledge Base

> Hand this file to the Cursor agent as-is. It covers everything needed to close the gaps identified in the input audit, without touching the page-by-page presentation components or the existing 16:9 print workflow.

---

## 0. Scope & Non-Goals

**In scope:**
- Add the remaining missing fields to `Clientdetails2.tsx`
- Extend `presentation-session.ts` with read/update functions
- Centralize company-wide stats as shared config
- Implement (or confirm existing) keyword matching against `notes-plans/module_list.md`

**Explicitly out of scope — do not touch:**
- Any page-by-page dynamic slide/PDF components (old or new format)
- The existing 16:9 print workflow in `globals.css` (`@media print { section { ... } }`)
- Section 3 content authoring (intro paragraph, client callouts, "who this is for", screenshot selection) — this is a separate, not-yet-designed piece of the `/validate` or build step. Do not attempt to add fields for it in this pass.

**Hard constraint:** every change below is additive. Nothing currently used by the old presentation workflow should be renamed, removed, or have its signature changed. If a conflict is found, stop and flag it rather than resolving it by modifying shared code.

---

## 1. New form fields — `Clientdetails2.tsx`

Add four new fields. All are **optional with minimum validation** — none should block submission. Follow the existing pattern already in the file (label / hint / input / error, `updateField` helper, same Tailwind classes).

| Field | Type | Label | Default | Validation |
|---|---|---|---|---|
| `letterAddresseeName` | text | "Letter addressee (if different from client name)" | empty → falls back to `clientName` at save time | none |
| `meetingDateReference` | date | "Date of client meeting" | today's date (same helper as `preparedDate`) | none |
| `validityDays` | number | "Proposal valid for (days)" | `30` | if provided, must be a positive integer; if blank, silently use 30 |
| `contactName` | text | "Prepared by (name)" | empty | none |
| `contactTeam` | text | "Team" | empty | none |
| `contactEmail` | email | "Contact email" | empty | loose email format check only if non-empty (reuse existing regex pattern from `clientEmail`) |
| `contactPhone` | text | "Contact phone" | empty | none |

**Placement:** group `letterAddresseeName` + `meetingDateReference` into the existing "Cover & letter details" block (alongside `documentTitle`, `recipientTitle`, `preparedDate`). Add `validityDays` there too.

Add a new block below "Commercial terms" called **"Proposal contact"** with a short hint: *"Shown in the footer of the final page."* Contains `contactName`, `contactTeam`, `contactEmail`, `contactPhone` in a 2-column grid.

**Wiring:** add all seven fields to `FormState`, `initialForm`, and the `saveProposalDetails(...)` call at submit time:

```ts
saveProposalDetails({
  // ...existing fields...
  letterAddresseeName: form.letterAddresseeName.trim() || form.clientName.trim(),
  meetingDateReference: form.meetingDateReference,
  validityDays: form.validityDays.trim() ? Number(form.validityDays) : 30,
  contactName: form.contactName.trim() || undefined,
  contactTeam: form.contactTeam.trim() || undefined,
  contactEmail: form.contactEmail.trim() || undefined,
  contactPhone: form.contactPhone.trim() || undefined,
});
```

Do not add these to `validateForm`'s blocking checks beyond what's noted in the table above.

---

## 2. Shared config for company-wide stats

Create a new file: `lib/company-stats.ts` (or `config/company-stats.ts` — match whichever convention the project already uses for static config; check if a `config/` directory exists first).

```ts
export const COMPANY_STATS = {
  organizationsServed: "25+",
  foundedYear: 2024,
  platformAvailability: "98%+",
  yearsExperience: "4+",
  payrollOnTime: "100%",
} as const;
```

This is **not a form input.** It's a single source of truth for numbers that currently appear in two separate places (cover page stats strip, COO letter opening paragraph — "Since 2024, we've helped over 25+ organizations..."). When those components are eventually built, both should import from here instead of hardcoding the values independently. No action needed on the components themselves right now — just create the config file so it exists ahead of that work.

---

## 3. `presentation-session.ts` — new functions

`saveProposalDetails` already exists. Add:

### `getProposalDetails()`
Read counterpart. Returns the stored `ProposalDetails` object (or `undefined`/`null` if nothing saved yet — match whatever the existing `savePresentationSession`/get pattern in this file already does for consistency).

### `updateProposalDetails(partial: Partial<ProposalDetails>)`
Merges `partial` into whatever is currently stored and saves the result. This is for the future `/validate` step to edit individual fields without resubmitting the whole form. Not consumed by anything yet — just needs to exist and work correctly.

### Type update
Extend whatever type `saveProposalDetails` currently accepts (likely `ProposalDetails`, defined either in this file or in a shared types file) to include the 7 new fields from Section 1 above, all optional:

```ts
letterAddresseeName?: string;
meetingDateReference?: string;
validityDays?: number;
contactName?: string;
contactTeam?: string;
contactEmail?: string;
contactPhone?: string;
```

### Stretch, not urgent
A `getProposalRenderData()` aggregator that merges `clientDetails` + `recommendation` + `proposalDetails` into one object shaped for the eventual page components. Nothing consumes this yet since those components don't exist. Only add it if trivial — otherwise skip and leave a `// TODO` comment noting it'll be needed once page-by-page rendering starts.

---

## 4. Keyword matching against `notes-plans/module_list.md`

**First step — check before building anything:** search the codebase (particularly `lib/module-recommendation.ts` and wherever `getModuleRecommendation` is defined/imported from) for any existing logic that reads `notes-plans/module_list.md` or parses similar module/feature markdown content. If it already exists and works, stop here and just leave a short confirmation note — do not duplicate it.

**If it does not exist yet:**

Create `lib/knowledge-base.ts`:

- Read `notes-plans/module_list.md` from disk. This file is static and changes rarely, so parse it once at module load (server-side only — confirm this file is never imported into a client component bundle, since `fs` access will fail in the browser).
- The file's structure is: `## ModuleName` headings, each followed by a markdown table with `| Feature | Platform |` columns, sections separated by `---`.
- Parse into a typed structure:

```ts
type ModuleFeature = { feature: string; platform: "Web" | "Mobile App" };
type ModuleDefinition = { name: string; features: ModuleFeature[] };

export const MODULES: ModuleDefinition[]; // parsed from the .md
```

- Add a matching function:

```ts
export function matchModulesFromKeywords(
  requirements: string,
  notes?: string
): string[]; // returns matched module names, most relevant first
```

  Minimum viable implementation: case-insensitive substring matching of words in `requirements` (and `notes` if provided) against each module's `name` and its features' `feature` text. Score by number of hits, return module names sorted by score descending. No fuzzy matching or NLP needed at this stage.

**Wiring decision — flag for review rather than assuming:** check what `getModuleRecommendation` currently does. If it's a simpler/different matching approach today, do not silently replace it. Two options:
  - (a) If `getModuleRecommendation`'s existing behavior is clearly a placeholder/stub, wire it to call `matchModulesFromKeywords` internally and confirm existing callers still get a compatible return shape.
  - (b) If it's already doing meaningful matching that something depends on, leave it alone and add `matchModulesFromKeywords` as a new, separate export in `knowledge-base.ts` for now. Note this in a comment so it can be consolidated later.

---

## 5. Non-breaking checklist (verify before considering this done)

- [ ] No existing export from `presentation-session.ts` was renamed, removed, or had its parameter shape changed in a way that breaks current callers
- [ ] `globals.css`'s `@media print { section { ... } }` block for the old 16:9 workflow is untouched
- [ ] No page-by-page dynamic slide/PDF component was modified
- [ ] `getModuleRecommendation`'s existing return shape is unchanged unless explicitly confirmed safe to change (see 4 above)
- [ ] Project builds/typechecks cleanly (`npm run build` or equivalent) after all changes
- [ ] The old presentation workflow can still be generated end-to-end without errors

---

## 6. Suggested order of work

1. Form fields in `Clientdetails2.tsx` (Section 1) — self-contained, lowest risk
2. `presentation-session.ts` additions (Section 3) — needed by the form's save call
3. `lib/company-stats.ts` (Section 2) — trivial, no dependencies
4. Knowledge base investigation + implementation (Section 4) — do this last since it requires the most judgment (check-before-build step)
5. Run the non-breaking checklist (Section 5)