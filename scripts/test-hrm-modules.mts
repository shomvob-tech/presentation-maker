/**
 * Unit tests for the HRM module mapping (lib/hris/hrm-modules.ts) and how the
 * expanded selection lays out (lib/module-page-layout.ts). No network.
 *
 *   npm run test:hrm-modules
 */

import assert from "node:assert/strict";
import {
  allHrmBuilderIds,
  expandHrmModules,
  HRM_MODULE_IDS,
  hrmBuilderIdsWithoutCopy,
  validateHrmModules,
  type HrmModuleId,
} from "../lib/hris/hrm-modules";
import { MODULE_HIGHLIGHTS } from "../lib/module-highlights";
import { MODULE_MAX_PER_PAGE, splitModulesAcrossPages } from "../lib/module-page-layout";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

test("every rendered card has copy with 4 bullets (content guard)", () => {
  assert.deepEqual(hrmBuilderIdsWithoutCopy(), []);
  for (const id of allHrmBuilderIds()) {
    const highlight = MODULE_HIGHLIGHTS.find((module) => module.id === id);
    assert.ok(highlight, id);
    assert.equal(highlight.bullets.length, 4, id);
  }
});

test("core expands to its member cards in HRM order", () => {
  assert.deepEqual(expandHrmModules(["core"]), [
    "employee-management",
    "leave",
    "attendance",
    "policy-management",
    "announcements",
  ]);
});

test("any input order normalises to package order", () => {
  const a = validateHrmModules(["core", "payroll"]);
  const b = validateHrmModules(["payroll", "core"]);
  assert.ok(a.ok && b.ok);
  assert.deepEqual(a.value, ["core", "payroll"]);
  assert.deepEqual(b.value, ["core", "payroll"]);
});

test("all seven ids are accepted and expand without duplicates", () => {
  const all = validateHrmModules([...HRM_MODULE_IDS].reverse());
  assert.ok(all.ok);
  assert.deepEqual(all.value, [...HRM_MODULE_IDS]);
  const cards = expandHrmModules(all.value);
  assert.equal(new Set(cards).size, cards.length);
  assert.equal(cards.length, 11);
});

test("invalid selections are rejected with the documented messages", () => {
  const cases: [unknown, RegExp][] = [
    [["payroll"], /must include "core"/],
    [["core", "core"], /Duplicate module id\(s\): core/],
    [[], /non-empty array/],
    [undefined, /non-empty array/],
    [null, /non-empty array/],
    ["core", /non-empty array/],
    [["core", 1], /non-empty array/],
    [["attendance"], /Unknown module id\(s\): attendance/],
    [["Core"], /Unknown module id\(s\): Core/],
    [["core", "ewa"], /Unknown module id\(s\): ewa/],
  ];
  for (const [input, message] of cases) {
    const result = validateHrmModules(input);
    assert.ok(!result.ok, JSON.stringify(input));
    assert.match(result.message, message, JSON.stringify(input));
  }
});

test("roster, device-integration, access-configuration and ewa never render", () => {
  const cards = allHrmBuilderIds();
  for (const id of ["roster", "device-integration", "access-configuration", "ewa"]) {
    assert.ok(!cards.includes(id), id);
  }
});

test("all 64 add-on subsets x problem statement lay out on <= 2 pages of <= 8 cards", () => {
  const addOns = HRM_MODULE_IDS.filter((id) => id !== "core");
  for (let mask = 0; mask < 1 << addOns.length; mask++) {
    const selection: HrmModuleId[] = ["core", ...addOns.filter((_, i) => mask & (1 << i))];
    const cards = expandHrmModules(selection);
    // Also as it will be once Reimbursement Management joins core (6 cards).
    for (const variant of [cards, ["reimbursement-management", ...cards]]) {
      for (const problemStatement of [false, true]) {
        const split = splitModulesAcrossPages(variant, problemStatement);
        assert.ok(split.pageCount <= 2);
        assert.ok(split.firstPageModuleIds.length <= MODULE_MAX_PER_PAGE);
        assert.ok(split.secondPageModuleIds.length <= MODULE_MAX_PER_PAGE);
        assert.equal(
          split.firstPageModuleIds.length + split.secondPageModuleIds.length,
          variant.length,
        );
      }
    }
  }
});

console.log(`HRM module tests passed (${passed}).`);
