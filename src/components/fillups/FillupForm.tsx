"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import type { FillupActionResult } from "@/lib/actions/fillups";

export type FillupFormValues = {
  fillDate: string;
  odometerKm: number;
  liters: number;
  totalEuros: number;
  isFull: boolean;
  station: string | null;
  sendToWalleta: boolean;
};

type Initial = Partial<Omit<FillupFormValues, "sendToWalleta">>;

/**
 * One form for add and edit. Speaks human units (€, L, km); the server action
 * converts to integer storage. The date defaults to today but is freely editable.
 */
export function FillupForm({
  initial,
  walletaEnabled,
  showWalletaToggle,
  submitLabel,
  onSubmit,
  onDone,
}: {
  initial?: Initial;
  walletaEnabled: boolean;
  /** Walleta push is create-only; hide the toggle when editing. */
  showWalletaToggle: boolean;
  submitLabel: string;
  onSubmit: (values: FillupFormValues) => Promise<FillupActionResult>;
  onDone?: (result: FillupActionResult) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [fillDate, setFillDate] = useState(initial?.fillDate ?? today);
  const [odometer, setOdometer] = useState(
    initial?.odometerKm != null ? String(initial.odometerKm) : "",
  );
  const [liters, setLiters] = useState(
    initial?.liters != null ? String(initial.liters) : "",
  );
  const [total, setTotal] = useState(
    initial?.totalEuros != null ? String(initial.totalEuros) : "",
  );
  const [isFull, setIsFull] = useState(initial?.isFull ?? true);
  const [station, setStation] = useState(initial?.station ?? "");
  const [sendToWalleta, setSendToWalleta] = useState(walletaEnabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const litersNum = parseFloat(liters.replace(",", "."));
  const totalNum = parseFloat(total.replace(",", "."));
  const perLiter =
    litersNum > 0 && totalNum > 0 ? (totalNum / litersNum).toFixed(3) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await onSubmit({
      fillDate,
      odometerKm: Math.round(parseFloat(odometer.replace(",", "."))),
      liters: litersNum,
      totalEuros: totalNum,
      isFull,
      station: station.trim() || null,
      sendToWalleta: showWalletaToggle && sendToWalleta,
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    // Reset the money fields for the next fill; keep date + odometer context.
    // Full tank snaps back to true — partial is the per-entry exception.
    setLiters("");
    setTotal("");
    setStation("");
    setIsFull(true);
    onDone?.(result);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* type="text" + inputMode, NOT type="number": iOS shows the pt-PT keypad
            with a comma key but number inputs silently reject "," — text inputs
            accept it, and parsing normalises "," to "." */}
        <Field label="Total €">
          <input
            type="text"
            inputMode="decimal"
            pattern="\d+([.,]\d{1,2})?"
            title="e.g. 45,50"
            required
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="45,50"
            className={inputCls}
          />
        </Field>
        <Field label="Liters">
          <input
            type="text"
            inputMode="decimal"
            pattern="\d+([.,]\d{1,3})?"
            title="e.g. 32,4"
            required
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            placeholder="32,4"
            className={inputCls}
          />
        </Field>
        <Field label="Odometer km">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d+"
            title="whole km, e.g. 123456"
            required
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            placeholder="123456"
            className={inputCls}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={fillDate}
            max={today}
            onChange={(e) => setFillDate(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Station (optional)">
          <input
            type="text"
            maxLength={80}
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="Galp, BP…"
            className={inputCls}
          />
        </Field>
        <div className="flex items-end gap-4 pb-1">
          <Toggle
            label="Full tank"
            checked={isFull}
            onChange={setIsFull}
            hint="needed for L/100km"
          />
          {walletaEnabled && showWalletaToggle && (
            <Toggle
              label="Add to Walleta"
              checked={sendToWalleta}
              onChange={setSendToWalleta}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {perLiter ? `${perLiter.replace(".", ",")} €/L` : " "}
        </span>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-over">{error}</span>}
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-2xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted focus:border-muted";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-fg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--brand)]"
      />
      <span>
        {label}
        {hint && <span className="ml-1 text-xs text-muted">({hint})</span>}
      </span>
    </label>
  );
}
