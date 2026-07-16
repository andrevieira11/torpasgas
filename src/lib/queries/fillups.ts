import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { fillups } from "@/db/schema";

/** Every fill-up for one user. The dataset is small (a car ≈ dozens/year) — all
 *  stats and charts are derived in pure code from this single read. */
export async function getFillups(userId: string) {
  return db
    .select({
      id: fillups.id,
      fillDate: fillups.fillDate,
      odometerKm: fillups.odometerKm,
      litersMl: fillups.litersMl,
      totalCents: fillups.totalCents,
      isFull: fillups.isFull,
      station: fillups.station,
      walletaSyncedAt: fillups.walletaSyncedAt,
    })
    .from(fillups)
    .where(eq(fillups.userId, userId));
}
