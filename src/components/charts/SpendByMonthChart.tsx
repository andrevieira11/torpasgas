"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthSpend } from "@/lib/fuel";
import { monthLabel } from "@/lib/format";

/** Gas spend per month — the "parts of the year" view. Shows the last 24 months. */
export function SpendByMonthChart({ data }: { data: MonthSpend[] }) {
  const rows = data.slice(-24).map((m) => ({
    month: monthLabel(m.month),
    euros: m.totalCents / 100,
  }));

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">Spend by month</h2>
      <div className="rounded-3xl border border-hairline bg-surface p-4">
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--fg)" }}
                formatter={(value) => [
                  `${Number(value).toLocaleString("pt-PT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} €`,
                  "spent",
                ]}
              />
              <Bar dataKey="euros" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
