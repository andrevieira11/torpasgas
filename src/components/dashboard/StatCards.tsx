import type { FuelStats } from "@/lib/fuel";
import {
  formatCents,
  formatKm,
  formatL100,
} from "@/lib/format";

/**
 * The headline numbers. Averages need two FULL fill-ups to exist — until then
 * they render as an em dash rather than a misleading zero.
 */
export function StatCards({
  stats,
  spentThisMonthCents,
  spentThisYearCents,
}: {
  stats: FuelStats;
  spentThisMonthCents: number;
  spentThisYearCents: number;
}) {
  const perLiter =
    stats.avgPricePerLiter != null
      ? `${stats.avgPricePerLiter.toLocaleString("pt-PT", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })} €/L`
      : "—";

  const cards = [
    {
      label: "Average consumption",
      value: stats.avgL100 != null ? formatL100(stats.avgL100) : "—",
      hint: stats.avgL100 == null ? "needs 2 full tanks" : undefined,
      accent: true,
    },
    {
      label: "Average price",
      value: perLiter,
    },
    {
      label: "Cost per 100 km",
      value:
        stats.costPer100Km != null
          ? formatCents(Math.round(stats.costPer100Km * 100))
          : "—",
    },
    { label: "Spent this month", value: formatCents(spentThisMonthCents) },
    { label: "Spent this year", value: formatCents(spentThisYearCents) },
    { label: "Km tracked", value: formatKm(stats.kmTracked) },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-3xl border border-hairline bg-surface p-4"
        >
          <div className="text-xs text-muted">{c.label}</div>
          <div
            className={`mt-1 text-lg font-semibold tracking-tight ${
              c.accent ? "text-brand" : "text-fg"
            }`}
          >
            {c.value}
          </div>
          {c.hint && <div className="mt-0.5 text-xs text-muted">{c.hint}</div>}
        </div>
      ))}
    </section>
  );
}
