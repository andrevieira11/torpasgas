import {
  pgTable,
  text,
  integer,
  boolean,
  date,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

/**
 * One row per visit to the pump. Integer units only (house rule — never floats):
 * money in cents, fuel in millilitres, odometer in whole km. Format at the UI edge.
 *
 * `isFull` drives the consumption math: L/100km is only computable between two
 * FULL fill-ups (tank level known at both ends). Partial fills are accumulated
 * into the next full segment.
 */
export const fillups = pgTable(
  "fillups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Calendar day of the fill-up (no timezone — a fill never shifts across midnight).
    fillDate: date("fill_date").notNull(),
    odometerKm: integer("odometer_km").notNull(),
    litersMl: integer("liters_ml").notNull(),
    totalCents: integer("total_cents").notNull(),
    isFull: boolean("is_full").default(true).notNull(),
    station: text("station"),
    // Set when the expense was accepted by Walleta/Saldo's ingest webhook.
    walletaSyncedAt: timestamp("walleta_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("fillups_user_date_idx").on(t.userId, t.fillDate),
    index("fillups_user_odo_idx").on(t.userId, t.odometerKm),
    check("fillups_liters_positive", sql`${t.litersMl} > 0`),
    check("fillups_total_positive", sql`${t.totalCents} > 0`),
    check("fillups_odo_nonnegative", sql`${t.odometerKm} >= 0`),
  ],
);
