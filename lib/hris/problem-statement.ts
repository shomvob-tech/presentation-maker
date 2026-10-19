/**
 * Allowlist for `problemStatementText` on the HRIS API.
 *
 * The module page renders this HTML with dangerouslySetInnerHTML (see the
 * warning in app/components/Moduleoverview.tsx) inside the server's own
 * Chromium, so input from outside the org must be plain formatting only. The
 * builder's editor (Tiptap StarterKit, no headings) produces exactly these
 * tags, with no attributes.
 *
 * Method: remove every allowed tag; if any `<` or `>` is left, reject. That
 * rejects attributes, comments, unknown tags and tags hidden inside other tags
 * (`<scr<p>ipt>` becomes `<script>` once `<p>` is gone). Text must escape `<`
 * and `>` as `&lt;` and `&gt;`.
 */

const ALLOWED_TAG = /<\/?(p|br|strong|b|em|i|u|s|ul|ol|li|blockquote)\s*\/?>/gi;

export const PROBLEM_STATEMENT_HTML_RULE =
  "May only use <p>, <br>, <strong>, <b>, <em>, <i>, <u>, <s>, <ul>, <ol>, <li> and <blockquote> " +
  "with no attributes. Escape < and > in text as &lt; and &gt;.";

export function validateProblemStatementHtml(
  html: string,
): { ok: true } | { ok: false; message: string } {
  const remainder = html.replace(ALLOWED_TAG, "");
  return /[<>]/.test(remainder)
    ? { ok: false, message: PROBLEM_STATEMENT_HTML_RULE }
    : { ok: true };
}
