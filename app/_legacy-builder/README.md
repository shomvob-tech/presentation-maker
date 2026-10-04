# Parked: the original presentation wizard

These pages are the first presentation builder — client details and
requirements (`/new`), module recommendation and point selection
(`/new/validate`), the generated deck (`/preview`), and the point-library
browser (`/knowledge`).

They were taken off the site when the presentation builder was rebuilt around
static slide copy (`/presentation-builder`). The code is kept, not deleted. The
leading underscore makes `_legacy-builder` a private folder, so Next.js does
not route anything inside it: every one of those URLs now returns 404.

What they still depend on, all left in place and no longer reachable from any
route:

- `lib/point-selection.ts`, `lib/points-generator.ts`, `lib/slide_points.json`,
  `lib/slide-defaults.ts`, `lib/presentation-content*.ts`,
  `lib/module-recommendation.ts`, `lib/knowledge-base.ts`,
  `lib/knowledge_base.json`
- `app/components/ClientDetailsForm.tsx`, `ValidateOptionsForm.tsx`,
  `ModuleRecommendation.tsx`, `KnowledgeBaseExplorer.tsx`, `slide-registry.tsx`,
  `usePresentationContent.ts`

Two things to know before restoring any of it:

- The deck slides no longer read generated points. Each slide renders its own
  hardcoded copy, so a restored wizard would pick modules but not wording.
- `/api/export-pdf`, which `ValidateOptionsForm` calls, is shared with the
  HRIS proposal builder. It stays live for that builder.

To restore a page, move its folder back up to `app/`.
