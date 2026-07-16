"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { fillups } from "@/db/schema";
import { getServerSession } from "@/lib/auth-session";
import { walletaConfig, sendToWalleta } from "@/lib/walleta";

/**
 * The form speaks human units (euros, liters); storage is integers (cents, mL).
 * Conversion happens here, inside the trust boundary, after zod validation.
 */
const fillupSchema = z.object({
  fillDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date"),
  odometerKm: z.coerce.number().int().min(0).max(5_000_000),
  liters: z.coerce.number().positive().max(500),
  totalEuros: z.coerce.number().positive().max(10_000),
  isFull: z.coerce.boolean(),
  station: z
    .string()
    .max(80)
    .transform((s) => s.trim() || null)
    .nullable(),
  sendToWalleta: z.coerce.boolean(),
});

export type FillupActionResult = {
  ok: boolean;
  error?: string;
  /** True when the fill-up saved but the Walleta push failed (non-fatal). */
  walletaFailed?: boolean;
};

function toRow(data: z.infer<typeof fillupSchema>) {
  return {
    fillDate: data.fillDate,
    odometerKm: data.odometerKm,
    litersMl: Math.round(data.liters * 1000),
    totalCents: Math.round(data.totalEuros * 100),
    isFull: data.isFull,
    station: data.station,
  };
}

export async function addFillup(input: unknown): Promise<FillupActionResult> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = fillupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const [row] = await db
    .insert(fillups)
    .values({ userId: session.user.id, ...toRow(parsed.data) })
    .returning({ id: fillups.id });

  let walletaFailed = false;
  const config = walletaConfig();
  if (config && parsed.data.sendToWalleta) {
    const sent = await sendToWalleta(config, {
      id: row.id,
      fillDate: parsed.data.fillDate,
      totalCents: Math.round(parsed.data.totalEuros * 100),
      station: parsed.data.station,
    });
    if (sent) {
      await db
        .update(fillups)
        .set({ walletaSyncedAt: new Date() })
        .where(eq(fillups.id, row.id));
    } else {
      walletaFailed = true;
    }
  }

  revalidatePath("/");
  return { ok: true, walletaFailed };
}

export async function updateFillup(
  id: string,
  input: unknown,
): Promise<FillupActionResult> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Not signed in." };

  const parsed = fillupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Walleta is create-only: edits here don't rewrite the expense there.
  const updated = await db
    .update(fillups)
    .set(toRow(parsed.data))
    .where(and(eq(fillups.id, id), eq(fillups.userId, session.user.id)))
    .returning({ id: fillups.id });
  if (updated.length === 0) return { ok: false, error: "Fill-up not found." };

  revalidatePath("/");
  return { ok: true };
}

export async function deleteFillup(id: string): Promise<FillupActionResult> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: "Not signed in." };

  await db
    .delete(fillups)
    .where(and(eq(fillups.id, id), eq(fillups.userId, session.user.id)));

  revalidatePath("/");
  return { ok: true };
}
