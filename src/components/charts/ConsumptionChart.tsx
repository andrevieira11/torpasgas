"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthConsumption } from "@/lib/fuel";
import { monthLabel } from "@/lib/format";

/** Average L/100km per month (weighted by km driven within each month). */
export function ConsumptionChart({ data }: { data: MonthConsumption[] }) {
  const rows = data.slice(-24).map((m) => ({
    month: monthLabel(m.month),
    l100: Number(m.l100.toFixed(2)),
  }));

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">
        Consumption over months
      </h2>
      <div className="rounded-3xl border border-hairline bg-surface p-4">
        <div className="h-48 w-full">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Needs two full tanks to start.
            </div>
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={rows}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  cursor={{ stroke: "var(--hairline)" }}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--fg)" }}
                  formatter={(value) => [`${value} L/100km`, "consumption"]}
                />
                <Line
                  type="monotone"
                  dataKey="l100"
                  stroke="var(--data-blue)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--data-blue)", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
