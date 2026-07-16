/**
 * Push a fill-up into Walleta (the Saldo expenses app) via its token-gated
 * /api/ingest webhook. We don't touch its DB — we send a text its moey! parser
 * reliably parses ("Compra de 45,50 EUR em <station> DD/MM/YYYY"), so the expense
 * lands in the inbox with amount + merchant + date already filled. After the
 * merchant is categorised once, Saldo's learned rule auto-categorises the rest.
 *
 * "EUR" (not "€") on purpose: the parser's anchored-amount regex ends in
 * `(?:€|eur)\b`, and \b after the non-word char € never matches — "EUR " does.
 *
 * external_id doubles as the dedupe key, so retries never duplicate an expense.
 */

export type WalletaConfig = { url: string; token: string };

export function walletaConfig(): WalletaConfig | null {
  const url = process.env.WALLETA_URL;
  const token = process.env.WALLETA_INGEST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** "1234567" cents -> "12.345,67" (pt-PT, the format Saldo's parser anchors on). */
export function centsToPtAmount(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = String(cents % 100).padStart(2, "0");
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${frac}`;
}

/** Build the ingest payload for a fill-up. Pure — unit tested. */
export function buildWalletaPayload(fillup: {
  id: string;
  fillDate: string; // "YYYY-MM-DD"
  totalCents: number;
  station: string | null;
}) {
  const [y, m, d] = fillup.fillDate.split("-");
  const merchant = fillup.station?.trim() || "Combustível";
  return {
    raw_text: `Compra de ${centsToPtAmount(fillup.totalCents)} EUR em ${merchant} ${d}/${m}/${y}`,
    external_id: `torpasgas:${fillup.id}`,
    source: "api" as const,
  };
}

/** POST to Walleta. Returns true when the expense was accepted (or deduped). */
export async function sendToWalleta(
  config: WalletaConfig,
  fillup: Parameters<typeof buildWalletaPayload>[0],
): Promise<boolean> {
  try {
    const res = await fetch(`${config.url}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(buildWalletaPayload(fillup)),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
