/**
 * Pure-logic checks for the Walleta payload builder. Run: `npx tsx src/lib/walleta.test.ts`.
 * The raw_text MUST stay parseable by Saldo's moey! parser
 * (avieira_expenses/src/lib/moey/parser.ts): amount anchored to €, merchant after
 * "em", full date at the end, and no IGNORE keywords ("saldo", "código", …).
 */
import assert from "node:assert/strict";
import { buildWalletaPayload, centsToPtAmount } from "./walleta";

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

check("cents format uses pt-PT comma and dot grouping", () => {
  assert.equal(centsToPtAmount(4550), "45,50");
  assert.equal(centsToPtAmount(505), "5,05");
  assert.equal(centsToPtAmount(123456789), "1.234.567,89");
  assert.equal(centsToPtAmount(100), "1,00");
});

check("payload text matches the moey!-parseable shape", () => {
  const p = buildWalletaPayload({
    id: "abc123",
    fillDate: "2026-07-16",
    totalCents: 4550,
    station: null,
  });
  assert.equal(p.raw_text, "Compra de 45,50 EUR em Combustível 16/07/2026");
  assert.equal(p.external_id, "torpasgas:abc123");
  assert.equal(p.source, "api");
});

check("station overrides the default merchant", () => {
  const p = buildWalletaPayload({
    id: "x",
    fillDate: "2026-01-02",
    totalCents: 7000,
    station: "BP Matosinhos",
  });
  assert.equal(p.raw_text, "Compra de 70,00 EUR em BP Matosinhos 02/01/2026");
});

check("raw_text replicates Saldo's parser expectations", () => {
  // Mirror of the parser's anchored-amount regex + merchant extraction: the
  // amount must anchor to €, and the merchant must stop before the date.
  const p = buildWalletaPayload({
    id: "x",
    fillDate: "2026-07-16",
    totalCents: 4550,
    station: "Galp",
  });
  const amount = /(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\s?(?:€|eur)\b/i.exec(p.raw_text);
  assert.ok(amount, "amount anchors to €");
  assert.equal(parseInt(amount![1].replace(/\./g, "") + amount![2], 10), 4550);
  const merchant =
    /\b(?:em|na|no|a|de)\s+(.+?)(?:\s+(?:\d{1,2}[/.\-]\d{1,2}|cart[aã]o|\*{2,}\d{2,})|[.,;]|$)/i.exec(
      p.raw_text.slice(amount!.index + amount![0].length),
    );
  assert.equal(merchant![1], "Galp");
  const date = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/.exec(p.raw_text);
  assert.ok(date, "date present for occurredAt");
});

console.log(`\n${passed} checks passed`);
