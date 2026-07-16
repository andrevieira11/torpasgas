/**
 * Pure-logic checks for the consumption math. Run: `npx tsx src/lib/fuel.test.ts`.
 * No framework — asserts and exits non-zero on failure.
 */
import assert from "node:assert/strict";
import {
  buildSegments,
  computeStats,
  spendByMonth,
  spendByMonthPart,
  consumptionByMonth,
  type FillupInput,
} from "./fuel";

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
}

const f = (
  id: string,
  fillDate: string,
  odometerKm: number,
  liters: number,
  euros: number,
  isFull = true,
): FillupInput => ({
  id,
  fillDate,
  odometerKm,
  litersMl: Math.round(liters * 1000),
  totalCents: Math.round(euros * 100),
  isFull,
});

check("two full fill-ups make one segment", () => {
  const segs = buildSegments([
    f("a", "2026-01-01", 10000, 40, 70),
    f("b", "2026-01-15", 10600, 42, 74),
  ]);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].km, 600);
  assert.equal(segs[0].litersMl, 42000);
  // 42 L over 600 km -> 7.0 L/100km
  assert.ok(Math.abs(segs[0].l100 - 7.0) < 1e-9);
});

check("partial fill rolls into the next full segment", () => {
  const segs = buildSegments([
    f("a", "2026-01-01", 10000, 40, 70),
    f("b", "2026-01-08", 10300, 15, 26, false),
    f("c", "2026-01-20", 10800, 30, 52),
  ]);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].km, 800);
  assert.equal(segs[0].litersMl, 45000); // 15 partial + 30 closing full
  assert.equal(segs[0].endId, "c");
});

check("a lone partial never creates a segment", () => {
  const segs = buildSegments([
    f("a", "2026-01-01", 10000, 40, 70),
    f("b", "2026-01-08", 10300, 15, 26, false),
  ]);
  assert.equal(segs.length, 0);
});

check("first fill-up contributes no fuel to any segment", () => {
  const segs = buildSegments([
    f("a", "2026-01-01", 10000, 50, 85), // pre-tracking fuel — odometer anchor only
    f("b", "2026-01-15", 10500, 35, 60),
  ]);
  assert.equal(segs[0].litersMl, 35000);
});

check("out-of-order input is sorted by odometer", () => {
  const segs = buildSegments([
    f("b", "2026-01-15", 10600, 42, 74),
    f("a", "2026-01-01", 10000, 40, 70),
  ]);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].endId, "b");
});

check("stats: overall average is km-weighted across segments", () => {
  const stats = computeStats([
    f("a", "2026-01-01", 10000, 40, 70),
    f("b", "2026-01-15", 10500, 35, 60), // 7.0 over 500 km
    f("c", "2026-02-01", 11500, 60, 100), // 6.0 over 1000 km
  ]);
  // (35+60) L over 1500 km -> 6.333…
  assert.ok(Math.abs(stats.avgL100! - 95 / 15) < 1e-9);
  assert.equal(stats.kmTracked, 1500);
  assert.equal(stats.totalSpentCents, 23000);
});

check("stats with fewer than two full fill-ups have null averages", () => {
  const stats = computeStats([f("a", "2026-01-01", 10000, 40, 70)]);
  assert.equal(stats.avgL100, null);
  assert.equal(stats.costPer100Km, null);
  assert.ok(stats.avgPricePerLiter !== null); // €/L needs only one fill
});

check("spendByMonth fills gap months with zero", () => {
  const months = spendByMonth([
    f("a", "2026-01-10", 10000, 40, 70),
    f("b", "2026-03-05", 11000, 40, 72),
  ]);
  assert.deepEqual(
    months.map((m) => m.month),
    ["2026-01", "2026-02", "2026-03"],
  );
  assert.equal(months[1].totalCents, 0);
});

check("spendByMonth crosses year boundary", () => {
  const months = spendByMonth([
    f("a", "2025-12-10", 10000, 40, 70),
    f("b", "2026-01-05", 11000, 40, 72),
  ]);
  assert.deepEqual(
    months.map((m) => m.month),
    ["2025-12", "2026-01"],
  );
});

check("spendByMonthPart buckets by day of month", () => {
  const parts = spendByMonthPart([
    f("a", "2026-01-05", 10000, 40, 70),
    f("b", "2026-01-15", 10500, 40, 72),
    f("c", "2026-02-25", 11000, 40, 74),
    f("d", "2026-03-10", 11500, 40, 76),
  ]);
  assert.equal(parts[0].totalCents, 7000 + 7600);
  assert.equal(parts[1].totalCents, 7200);
  assert.equal(parts[2].totalCents, 7400);
});

check("consumptionByMonth lands segments in the closing month", () => {
  const byMonth = consumptionByMonth([
    f("a", "2026-01-28", 10000, 40, 70),
    f("b", "2026-02-10", 10500, 35, 60),
  ]);
  assert.equal(byMonth.length, 1);
  assert.equal(byMonth[0].month, "2026-02");
  assert.ok(Math.abs(byMonth[0].l100 - 7.0) < 1e-9);
});

console.log(`\n${passed} checks passed`);
