/** pt-PT / EUR formatting at the UI edge. Storage is integer cents / millilitres / km. */

const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const num = (digits: number) =>
  new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export function formatCents(cents: number): string {
  return eur.format(cents / 100);
}

export function formatLiters(ml: number): string {
  return `${num(2).format(ml / 1000)} L`;
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat("pt-PT").format(km)} km`;
}

/** €/L derived from a fill-up (cents ÷ mL, both integers). */
export function formatPricePerLiter(totalCents: number, litersMl: number): string {
  if (litersMl <= 0) return "—";
  return `${num(3).format(totalCents / 100 / (litersMl / 1000))} €/L`;
}

export function formatL100(l100: number): string {
  return `${num(1).format(l100)} L/100km`;
}

/** "2026-07-16" -> "16/07/2026" without constructing a Date (no tz drift). */
export function formatDatePt(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1]} ${String(y).slice(2)}`;
}
