import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-session";
import { getFillups } from "@/lib/queries/fillups";
import {
  computeStats,
  spendByMonth,
  spendByMonthPart,
  consumptionByMonth,
  enrichForList,
} from "@/lib/fuel";
import { walletaConfig } from "@/lib/walleta";
import { StatCards } from "@/components/dashboard/StatCards";
import { AddFillup } from "@/components/fillups/AddFillup";
import { FillupList } from "@/components/fillups/FillupList";
import { SpendByMonthChart } from "@/components/charts/SpendByMonthChart";
import { ConsumptionChart } from "@/components/charts/ConsumptionChart";
import { MonthPartsChart } from "@/components/charts/MonthPartsChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const fillups = await getFillups(session.user.id);
  const stats = computeStats(fillups);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisYear = String(now.getFullYear());
  const spentThisMonthCents = fillups
    .filter((f) => f.fillDate.startsWith(thisMonth))
    .reduce((s, f) => s + f.totalCents, 0);
  const spentThisYearCents = fillups
    .filter((f) => f.fillDate.startsWith(thisYear))
    .reduce((s, f) => s + f.totalCents, 0);

  return (
    <main className="space-y-6 pb-12">
      <StatCards
        stats={stats}
        spentThisMonthCents={spentThisMonthCents}
        spentThisYearCents={spentThisYearCents}
      />

      <AddFillup
        walletaEnabled={walletaConfig() !== null}
        lastOdometerKm={
          fillups.length
            ? Math.max(...fillups.map((f) => f.odometerKm))
            : null
        }
      />

      {fillups.length > 0 && (
        <>
          <SpendByMonthChart data={spendByMonth(fillups)} />
          <div className="grid gap-6 sm:grid-cols-2">
            <ConsumptionChart data={consumptionByMonth(fillups)} />
            <MonthPartsChart data={spendByMonthPart(fillups)} />
          </div>
        </>
      )}

      <FillupList
        fillups={enrichForList(fillups)}
        walletaEnabled={walletaConfig() !== null}
      />
    </main>
  );
}
