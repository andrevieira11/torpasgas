"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthPartSpend } from "@/lib/fuel";

/** Which part of the month the money goes: days 1–10 / 11–20 / 21–31, all time. */
export function MonthPartsChart({ data }: { data: MonthPartSpend[] }) {
  const rows = data.map((p) => ({ part: p.part, euros: p.totalCents / 100 }));

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">
        When in the month
      </h2>
      <div className="rounded-3xl border border-hairline bg-surface p-4">
        <div className="h-48 w-full">
          <ResponsiveContainer>
            <BarChart
              data={rows}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="part"
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                width={44}
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
