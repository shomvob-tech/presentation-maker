# Client Presentation Maker — Current State & Path to Product

## 1. What This Is

An internal tool that generates client-specific overview presentations for Shomvob HRM. Instead of manually rebuilding a deck for every client after a demo meeting, the sales/product team inputs the client's details and requirements, and the system assembles a tailored presentation — same visual style every time, but scoped to the modules and features that specific client actually cares about.

**Who uses it:** Non-technical sales team members and the product team, internally.

## 2. The Problem It Solves

Every client demo surfaces different priorities — one client wants payroll and attendance in depth, another only cares about the dashboard, a third needs the recruitment workflow but only one specific feature of it. Today that means manually assembling a new deck (or heavily editing an old one) for every client, which is slow and inconsistent. This tool turns that into: fill in a form → get a client-ready deck.

## 3. Current State (MVP)

The MVP is built and functional end-to-end for the "happy path":

| Piece | Status |
|---|---|
| Slide rendering | ✅ Built — Next.js app, each slide is an individual dynamic component, consistent style/layout across all decks |
| Content data | ⚠️ Built, but MVP-quality only — the knowledge base and slide-points library (module descriptions, business problems, features, benefits, priority-ranked point library) were generated with AI using minimal context, just to unblock the MVP. Since this content will become the system's source of truth, it needs substantial review and expansion before it can be relied on. Knowledge_base.json — the "why this matters" layer. Module-level context: descriptions, business problems it solves, feature list, benefits, and keywords. Used to establish whether a module/feature is relevant to a client's stated pain point. Slide_points.json — the "what to actually say" layer. A priority-ranked library of exact candidate slide copy (title, description, business benefit) per module, plus min/max points per slide. Used to pick or generate the actual bullets that go on the slide once relevance is established. |
| Client input | ✅ Built — form for client name, email, logo, required modules, pain points, per-feature focus points, extra notes |
| Module/content selection | ⚠️ Built, but basic — currently plain **keyword matching** against the knowledge base and point library to decide which points appear |
| Deck structure | ✅ Built — fixed 3 intro slides + 1 closing slide; module slides in between, any order, only selected modules included |
| Preview & edit | ⚠️ Partially built — can toggle modules on/off and re-select at preview stage; a "notes for AI" field exists in the UI but isn't functional yet |
| PDF export | ✅ Built — selected deck is hosted at a temporary link, the page is captured and converted to PDF (Playwright) |
| Email delivery | ❌ Not built — sending the PDF to the client is currently manual |

**In short:** the pipeline from input → deck → PDF works. The part that's still rough is *how well the system picks the right content* for each client, and a few operational pieces (email, access, persistence) that any real internal tool needs.

## 4. Gaps Between MVP and a Usable Product

1. **Content matching is naive, and scoped only to what's requested.** Keyword matching won't reliably handle real client pain points written in plain language, and it only looks within the modules/features the client explicitly asked for — it doesn't check whether a pain point they mentioned is actually solved by a feature they didn't think to connect it to. This is the main functional gap — and the reason the "notes for AI" field exists but doesn't do anything yet.
2. **No persistence.** There's no record of past clients, decks generated, or what was sent to whom.
3. **No access control.** Multiple team members will use this; there's currently no login/permission layer. Open question: is this needed? Or have just one login with an extra input during presentation-making=> "Client Owner" OR "Creator Name" to keep track?
4. **No email sending.** The last step of the workflow (send PDF to client) is manual today.
5. **Content lives in flat JSON files, edited by developers only.** This is acceptable for now — there's no near-term need for non-engineers to add modules or points themselves.
6. **No input validation/error handling** for the client-facing form or the generation step.

## 5. Proposed Plan

A phased approach — each phase stands on its own and delivers something usable.

**Phase 1 — Build a robust knowledge base**
Discuss and finalize format and content of knowledge base. Curren

**Phase 2 — Harden the core workflow**
Add authentication for internal users, persist client submissions and generated decks (so there's a history), and wire up real email sending (Resend, per earlier discussion). This turns the MVP into something a team can actually rely on daily, without touching the matching logic yet.

**Phase 3 — Build the AI matching/suggestion engine**
Replace keyword matching with an LLM-based selection step. Worth noting: the full knowledge base and slide-points library are small enough (roughly 10 modules, a handful of points each) to pass entirely into a single model call — no vector search or retrieval infrastructure needed. The model would take the client's modules, pain points, per-feature focus notes, and free-text notes, and:

- Select which existing points to use per requested feature, with a fallback (AI suggestion or preselected default) when nothing in the library is a good fit
- Cross-check every stated pain point against the *whole* knowledge base, not just the modules the client asked for — if a feature outside their request actually solves a pain point they mentioned, surface it as a suggested addition with the reasoning spelled out, so the sales rep can decide whether to include it at the preview stage
- Stay strictly bounded to what's already in the knowledge base and slide-points library — the model selects, recombines, and explains existing content, but never invents a feature, benefit, or capability that isn't already documented in the source data

This is the piece that makes the "notes for AI" field actually work.

**Phase 4 — Optional: generalize beyond one product**
If there's appetite later, the same engine (matching + deck assembly + PDF/email) could be made to work for other products' knowledge bases, turning this from a single-purpose internal tool into a reusable platform. This is also the point where non-engineer content editing (a lightweight CMS/admin UI instead of dev-edited JSON) would become worth building, since more contributors and a larger content set would justify it. Not needed for the current use case — worth deciding now only so Phase 2 isn't built in a way that rules it out later.

## 6. Open Decisions for Discussion

- **Knowledge:** How do we finalize the knowledge base? Should I sit with you to finalize a list of usp or do I decide? Nowshad bhai has a sheet with in-depth context for each feature. But we need to prioritize which points to focus on from there. Also need to finalize default points (and number of points) for each feature.
- **Scope:** Keep this strictly as an internal tool for Shomvob HRM, or design it so it could generalize to other products down the line?
- **Priority:** Does Phase 1 (reliability) or Phase 2 (AI matching quality) matter more right now? Do we need ai matching or a robust keyword matching will do?
- **Matching fallback rule:** When nothing in the point library fits, should the system always try an AI-generated suggestion first, or default to preset points and let a human override in preview?
- **Access control:** Build auth/permissions for each user of the tool? Or have just one login with an extra input during presentation-making=> "Client Owner" OR "Creator Name" to keep track?
- **Style and layout:** How much of the current theme, design or layout are we keeping in? How much change do we want? Is there a specific style we should follow (e.g. focus on shomvob colours, follow your pitch deck's theme)