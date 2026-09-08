"use client";

/**
 * Browser side of the usage log.
 *
 * Owns the three ids and the small amount of prior state the log can't
 * reconstruct after the fact (preview count, input timestamps, the previous
 * field snapshot for diffing). All of it lives in `localStorage`, not
 * `sessionStorage`: previews open with `noopener`, so a new tab would not
 * inherit session storage.
 *
 * `device_id` identifies a browser, not a person. We deliberately do not
 * capture who made a proposal — see notes-plans/ for that discussion.
 *
 * Every function here is failure-tolerant on purpose. Blocked storage, a
 * private window, or an offline network must never surface to the rep filling
 * in the form.
 */

import type { AuditClientPayload, AuditDocType, AuditEventName } from "./events";

const DEVICE_KEY = "audit-device-id";
const SESSION_KEY = "audit-session";
const DRAFT_KEY_PREFIX = "audit-draft-";

/** A session is one sitting; 30 minutes idle starts a new one. */
const SESSION_IDLE_MS = 30 * 60 * 1000;

type SessionState = { id: string; lastSeenAt: number };

type DraftState = {
  draftId: string;
  previewCount: number;
  firstInputAt: string | null;
  lastInputAt: string | null;
  /** Last snapshot sent to the sheet, for the field diff. */
  snapshot: Record<string, unknown> | null;
};

function newId(): string {
  // randomUUID needs a secure context; localhost counts, but fall back rather
  // than throwing if it's ever missing.
  try {
    return crypto.randomUUID();
  } catch {
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
    );
  }
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full — the event still gets sent, just without
    // whatever this would have contributed.
  }
}

function draftKey(docType: AuditDocType): string {
  return DRAFT_KEY_PREFIX + docType;
}

function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;

    const created = newId();
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return "unavailable";
  }
}

function getSessionId(): string {
  const now = Date.now();
  const existing = readJson<SessionState>(SESSION_KEY);

  const id =
    existing && now - existing.lastSeenAt < SESSION_IDLE_MS
      ? existing.id
      : newId();

  writeJson(SESSION_KEY, { id, lastSeenAt: now });
  return id;
}

function readDraft(docType: AuditDocType): DraftState {
  return (
    readJson<DraftState>(draftKey(docType)) ?? {
      draftId: newId(),
      previewCount: 0,
      firstInputAt: null,
      lastInputAt: null,
      snapshot: null,
    }
  );
}

function writeDraft(docType: AuditDocType, state: DraftState): void {
  writeJson(draftKey(docType), state);
}

/**
 * Starts a new document. Called when a builder form mounts — the form always
 * mounts blank, so one page visit is one draft, and every preview or export
 * within that visit belongs to it.
 */
export function beginDraft(docType: AuditDocType): string {
  const draftId = newId();
  writeDraft(docType, {
    draftId,
    previewCount: 0,
    firstInputAt: null,
    lastInputAt: null,
    snapshot: null,
  });
  return draftId;
}

/**
 * Records that the rep typed something. Returns true only the first time for
 * a given draft, which is the `form_touched` signal — a draft with a touch and
 * no preview is an abandoned one, inferred at read time rather than by trying
 * to catch the tab closing.
 */
export function markInput(docType: AuditDocType): boolean {
  const draft = readDraft(docType);
  const now = new Date().toISOString();
  const isFirstInput = draft.firstInputAt === null;

  writeDraft(docType, {
    ...draft,
    firstInputAt: draft.firstInputAt ?? now,
    lastInputAt: now,
  });

  return isFirstInput;
}

export function bumpPreviewCount(docType: AuditDocType): number {
  const draft = readDraft(docType);
  const previewCount = draft.previewCount + 1;
  writeDraft(docType, { ...draft, previewCount });
  return previewCount;
}

/**
 * Top-level keys whose value changed since the last snapshot, and stores the
 * new one. Keys only — never values: this is here to show which fields people
 * keep re-typing (i.e. where the defaults are wrong), not to mirror the
 * document into the log.
 */
export function diffAgainstSnapshot(
  docType: AuditDocType,
  next: Record<string, unknown>,
): string[] {
  const draft = readDraft(docType);
  const previous = draft.snapshot;

  writeDraft(docType, { ...draft, snapshot: next });

  if (!previous) return [];

  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return [...keys].filter((key) => {
    try {
      return JSON.stringify(previous[key]) !== JSON.stringify(next[key]);
    } catch {
      return false;
    }
  });
}

/** What's in `selected` but not `defaults`, and vice versa. */
export function arrayDelta(
  selected: readonly string[],
  defaults: readonly string[],
): { added: string[]; removed: string[] } {
  return {
    added: selected.filter((item) => !defaults.includes(item)),
    removed: defaults.filter((item) => !selected.includes(item)),
  };
}

/** Current draft state, for call sites that just need to read the counters. */
export function currentDraft(docType: AuditDocType): DraftState {
  return readDraft(docType);
}

/**
 * Sends one event. Fire-and-forget: the request is never awaited and every
 * failure is swallowed, so a click behaves identically whether the log is
 * reachable, misconfigured, or blocked by an extension.
 */
export function logEvent(
  event: AuditEventName,
  docType: AuditDocType,
  fields: Omit<AuditClientPayload, "event" | "doc_type"> = {},
): void {
  if (typeof window === "undefined") return;

  try {
    const draft = readDraft(docType);

    const payload: AuditClientPayload = {
      event_id: newId(),
      event,
      doc_type: docType,
      device_id: getDeviceId(),
      session_id: getSessionId(),
      draft_id: draft.draftId,
      preview_count: draft.previewCount,
      first_input_at: draft.firstInputAt ?? "",
      last_input_at: draft.lastInputAt ?? "",
      ...fields,
    };

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Logging is never worth an interrupted export.
  }
}
