# Shomvob Proposal Format — Source of Truth

> This document defines the standard format, content, and visual rules for all Shomvob HR client proposals. It is the authoritative reference for the proposal builder app.

---

## Overview

Every proposal is a PDF built from 4 sections in a fixed order. Section 3 is the only section that can span multiple pages depending on the number of modules and problem-solving specifics. All other sections target one page each.

| Section | Name | Pages |
|---|---|---|
| 1 | Cover | 1 |
| 2 | Letter from COO | 1 |
| 3 | Solution Proposal | 1 or more |
| 4 | Commercial Terms & Conditions | 1 |

---

## Global Design Rules

These rules apply to every page in the document.

### Letterhead Chrome
Every page **except the cover** shares the same letterhead frame:

- **Left sidebar**: full-height narrow bar, 7mm wide. Upper portion (#28a143 green, ~34mm), lower portion (#58595b gray). The cover page uses this same bar mirrored on both sides, but the right-side bar only appears on the cover — interior pages have the bar on the left only.
- **Top-right decoration**: a cluster of overlapping rounded squares in varying opacities of the brand green. Decorative only. Appears on interior pages (letter, solution, commercial) — not on the cover.
- **Shomvob HR logo**: top-left, positioned inside the header area, above the content. Interior pages only — the cover has the logo at the bottom instead.
- **Footer**: small, bottom of every page. Left side: "Shomvob Technologies Ltd". Right side: "Proposal for [Client Name] — Page [N]". Exception: final page footer left side shows the proposal contact's name, team, email, and phone instead.

### Typography
- Font: **Inter** (system fallback: Arial)
- Body text: 10–10.5pt, #2b2b2b, line-height 1.5–1.65
- Section headings: 12–13pt, bold, #28a143 (brand green)
- Page title (h1): 18–21pt, 800 weight, #232323
- Eyebrow labels: 8–9pt, uppercase, letter-spaced, #28a143

### Brand Colors
- Green: `#28a143`
- Deep green: `#1b7a34`
- Gold/yellow: `#edb713`
- Gray: `#58595b`
- Ink (text): `#232323`
- Muted text: `#5b5b5b`
- Tint (callout background): `#eef6ef`
- Rule/border: `#dcdcdc`

### Tables
- Header row: solid `#28a143` background, white text, bold, 8.8–9pt
- Body rows: alternating white background, `#dcdcdc` bottom border
- Label column (left): bold, `#232323`, fixed width ~55–65mm
- Value column: regular weight, `#3a3a3a`
- Financial figures: bold, `#1b7a34` (deep green)

### Callout Boxes
Used for highlighting important or nuanced information within the solution section. Style:
- Background: `#eef6ef` (green tint)
- Left border: 3pt solid `#28a143`
- Padding: ~4mm all sides
- Font: 9pt, `#333`

---

## Section 1 — Cover Page

**Purpose:** First impression. Clean, minimal, client-facing.

### Layout
- Full white background, all content centered horizontally
- **Left and right sidebar bars** — same green-top/gray-bottom bar as every other page in the document, mirrored on both sides. Green segment (~34mm tall) at the top, gray for the remainder. Width 7mm each side. This ties the cover visually into the rest of the document.
- No top bar, no floating decorative elements, no background patterns
- Content is distributed top-to-bottom using `space-between`, with the stat strip acting as the lower anchor and the Shomvob footer as the base

### Content (top to bottom)
1. **Client logo** — centered, max ~80mm wide, max ~62mm tall. Uses the client's actual logo file.
2. **Gold rule** — short horizontal line in `#edb713`, centered, ~18mm wide. Visual separator.
3. **Eyebrow** — uppercase label: `PROPOSAL`
4. **Document title** — large, bold. Default: **"Workforce Management Ecosystem"**. Should be updated to match the scope when the proposal covers a more specific subset. Examples: *"Attendance, Leave & Device Integration"*, *"Attendance, Payroll & Workforce Management"*.
5. **Thin green divider line** — gradient fade from transparent → `#28a143` → transparent. Separates title from metadata.
6. **Proposal metadata** — three lines, centered, regular weight:
   - `Prepared for: [Client Full Name]`
   - `Prepared by: Shomvob Technologies Limited`
   - `Date: [DD Month, YYYY]`
7. **Stats strip** — a single horizontal row of 4 Shomvob credibility stats, separated by thin `#e2e2e2` hairline dividers. Each stat has a bold dark numeral and a small uppercase gray label beneath it. Stats are static:

   | Stat | Label |
   |---|---|
   | 25+ | Organizations Served |
   | 98%+ | Platform Availability |
   | 4+ | Years Experience |
   | 100% | Payroll On Time |

8. **Shomvob HR logo + name** — centered at the bottom. Logo ~11mm tall, "Shomvob Technologies Limited" in small gray text beneath.

### Design notes
- The cover intentionally uses no letterhead chrome other than the side bars — no top-right square cluster, no logo in the header position
- The side bars are the only element shared with the rest of the document, creating visual continuity without competing with the client's logo
- The stats strip fills the lower zone with meaningful content rather than decorative padding

### App inputs required
- Client logo (image upload)
- Document title (text field — defaults to "Workforce Management Ecosystem", overridable)
- Client full name (text field)
- Date (date picker, defaults to today)

---

## Section 2 — Letter from COO

**Purpose:** A formal, personalized letter from Hasib Rahman (COO) introducing Shomvob and the proposal. Builds trust and establishes tone before the technical content.

### Layout
Uses the standard letterhead chrome. Content starts just below the logo.

### Content (top to bottom)
1. **Date line** — `Date: [DD Month, YYYY]`
2. **Recipient block** —
   ```
   To,
   [Recipient Title]
   [Client Full Name / Group Name]
   ```
3. **Subject line** — bold. Format: `Subject: Proposal for SaaS Based Human Resource Information System for [CLIENT NAME].`
4. **Salutation** — `Dear Sir,`
5. **Letter body** — structured into labeled sections:

   **Opening paragraph** (no heading) — introduces Shomvob, states it's a cloud-based HR/Payroll solutions provider, references how many organizations have been helped since 2024 (currently: 25+).

   **Solution Overview** — references the specific meeting date, proposes the cloud-based HRIS, mentions key benefits: accessible from anywhere, no IT infrastructure required, secure real-time access.

   **No Upfront Costs & Scalable Solution** — explains the SaaS model: no hardware costs, pay-as-you-go subscription, scalable with the organization.

   **Ongoing Support & Updates** — continuous updates included, dedicated support team available.

   **Closing paragraph** — expresses enthusiasm for the partnership, invites follow-up.

6. **Signature block** —
   - Signature image (Hasib Rahman's signature)
   - `Hasib Rahman` (bold)
   - `Chief Operating Officer`
   - `Shomvob Technologies Limited`

### App inputs required
- Date (shared with cover, no separate input)
- Recipient title (text field, e.g. "Managing Director")
- Client full name / group name (shared with cover)
- Meeting date reference in the body (text field, defaults to proposal date)

> **Note:** The body paragraphs are largely static. Only the client name, date, and recipient title are dynamic. The signature image is a fixed asset.

---

## Section 3 — Solution Proposal

**Purpose:** The core of the document. Shows what Shomvob is proposing — what modules the client gets, what problems they solve, and any client-specific configurations or solutions.

This section can be **one page or multiple pages** depending on:
- Number of modules selected
- Whether screenshots are included
- Presence and length of client-specific callouts

### Page Structure within Section 3

#### 3A — Module Overview Page (always present, always first)

**Header area:**
- Eyebrow label: `PROPOSAL — SHOMVOB HR MANAGEMENT`
- H1 title: a short, specific title reflecting the scope (e.g. *"Attendance, Leave & Device Integration"* or *"Attendance, Payroll & Workforce Management"*). Driven by the modules selected.
- Meta line: `Prepared for: [Client Name]  |  Date: [Date]  |  Valid for: 30 days`
- Green rule beneath the meta line

**Introduction paragraph:**
A 3–5 sentence paragraph describing what the system does in the context of this specific client's operation. Not generic — references the client's actual business type, team structure, and pain points. This is manually written or AI-assisted per engagement.

**"What your team gets" section:**
A 2-column grid of feature blocks, one per module. Each block contains:
- Module name (bold heading)
- 4 bullet points of the most relevant features from that module

Modules are pulled from the master module list. The 4 bullets per module should be selected to match what's relevant to the client's context.

**Client-specific callout(s):**
Any client-specific configuration or solution that doesn't fit neatly into a module bullet. Examples from past proposals:
- The mobile/dummy number explanation (Terraprime)
- The payroll disbursement report format (Taza Hair Oil)

Format: a titled callout box with a short explanation. Can include a visual example if the content benefits from one (e.g. the `012xxxxx + Emp ID = 012xxxxx014` chip format used in Terraprime).

**"Who this is for" strip (optional):**
A 3-column strip naming the departments or roles this system will serve, with a one-line description each. Useful when the client has multiple distinct teams using the product. Skip if the scope is simple or obvious.

#### 3B — Workflow/Process Pages (optional, one or more)

Used when the client would benefit from seeing how the system works day-to-day rather than just what features are included. Typically 1 page. Can be split into 2 if covering multiple distinct workflows (e.g. attendance + payroll separately).

**Format:**
- Section heading (e.g. *"Attendance & device integration, day to day"*)
- Short intro sentence
- A 2-column **process table**: left column is the event/trigger, right column is what happens automatically

Each table covers one workflow. A single page can contain 2 tables.

**Example tables used:**
- Attendance & Device Integration day-to-day
- Leave, request to approval
- Leave & payroll, request to payout

#### 3C — Product Screenshots (optional)

Used to give the client a visual preview of the actual platform. Typically 1–2 pages.

**Placement:** After the module overview, before or after the workflow tables. Based on proposal length and flow.

**Format per screenshot:**
- Full-width image with a thin border and subtle drop shadow
- Short caption in small italic text below each image

**Available screenshots (current set):**
- `dashboard_ss` — Main dashboard: attendance overview and leave summary
- `attendance_ov_ss` — Attendance Overview: daily check-ins, on-time/late/absent
- `attendance_dashboard_ss` — 30-day attendance trend chart
- `leave_allocation_ss` — Leave allocation per employee and leave type
- `payroll_dashboard_ss` — Payroll dashboard with status and risk summary

**Selection logic:**
Include screenshots relevant to the modules being proposed. Don't include payroll screenshots if payroll isn't part of the scope.

---

## Section 4 — Commercial Terms & Conditions

**Purpose:** The financial and legal page. Confirms pricing, scope, and terms. Client and Shomvob reference this for sign-off.

### Layout
Uses the standard letterhead chrome. Footer (left side) shows proposal contact details: `[Name] · [Team] · [email] · [phone]`.

### Content (top to bottom)

**Eyebrow:** `PROPOSED FINANCIAL`

**H1 title:** `Commercial Terms & Conditions`

**Intro paragraph:**
A short fixed sentence about competitive pricing and long-term partnership. Only the client name is dynamic.

**Commercial terms table:**

| Category | Details |
|---|---|
| Client Name | [Client full name] |
| Number of Employees | [N] Employees |
| HRIS Monthly Subscription Fee (MRC) | [Amount] BDT |
| Software Rollout Charge | [Amount] BDT |
| Support | Maintenance & Technical Support Free |
| Field Employee Tracking (MRC) | Per User [Amount] BDT |

All rows are data-driven. Some rows (e.g. Field Employee Tracking) are optional — only shown if applicable to the client's scope.

**Additional Services During Subscription:**
A callout box containing:
> **Customization** — Any customization beyond the standard features will be subject to additional charges. A detailed feature-wise quotation will be shared after the requirement analysis is completed.

This text is static.

**Terms and Conditions:**
A numbered list. Currently 3 items (shown as numbered, green-accented):
1. 5% VAT will be added on the total invoice amount.
2. Payment should be made through bank transfer or cheque in favor of Shomvob Technologies Ltd.
3. Any additional features or modules requested after the trial-and-error period will be subject to additional charges, based on scope and requirements.

Items 2 and 3 are static. Item 1 (VAT rate) is confirmed at 5% as of current proposals.

### App inputs required
- Client full name (shared)
- Number of employees (number field)
- HRIS Monthly Subscription Fee / MRC (number field)
- Software rollout charge (number field)
- Field Employee Tracking per-user fee (number field, optional — show/hide based on scope)
- Proposal contact name, team, email, phone (for footer — can be a saved profile per sales rep)

---

## App Data Model — Key Inputs Summary

| Field | Used in | Notes |
|---|---|---|
| Client full name | Cover, Letter, S3 meta, S4 table | Single source |
| Client logo | Cover | Image upload |
| Proposal date | Cover, Letter, S3 meta | Date picker |
| Document title | Cover, S3 H1 | Defaults to "Workforce Management Ecosystem"; overridable per proposal |
| Recipient title | Letter | e.g. "Managing Director" |
| Meeting date reference | Letter body | Defaults to proposal date |
| Modules selected | S3 grid, screenshots, title | Multi-select from master list |
| Intro paragraph (S3) | S3 overview | Free text / AI-assisted |
| Client-specific callouts | S3 | Optional, one or more, free text |
| Include "Who this is for" | S3 | Toggle + 3 department name/description pairs |
| Include workflow tables | S3 | Toggle per table |
| Include screenshots | S3 | Toggle + which screenshots to include |
| Employee count | S4 table | Number |
| MRC fee | S4 table | Number (BDT) |
| Rollout charge | S4 table | Number (BDT) |
| Field tracking per-user fee | S4 table | Number (BDT), optional |
| Contact name / team / email / phone | S4 footer | Saved rep profile |

---

## What is Static vs Dynamic

| Element | Static | Dynamic |
|---|---|---|
| Shomvob HR logo | ✓ | |
| Hasib Rahman signature | ✓ | |
| Letter body paragraphs | ✓ | |
| Customization note | ✓ | |
| T&C items 2 and 3 | ✓ | |
| VAT rate (5%) | ✓ | |
| Client logo | | ✓ |
| Client name and details | | ✓ |
| Proposal date | | ✓ |
| Document title | | ✓ (auto or manual) |
| Modules and their bullets | | ✓ |
| Intro paragraph | | ✓ |
| Client-specific callouts | | ✓ |
| Screenshots selected | | ✓ |
| Pricing figures | | ✓ |
| Contact in footer | | ✓ (per rep) |

---

## Version History

| Version | Date | Notes |
|---|---|---|
| 1.0 | 06 August, 2026 | Format finalized based on Terraprime v2 and Taza Hair Oil proposals |
| 1.1 | 08 August, 2026 | Cover page redesigned: side bars mirrored from letterhead, floating decoration removed, stats strip added, default title set to "Workforce Management Ecosystem" |