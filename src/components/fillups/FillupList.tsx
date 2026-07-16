"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { updateFillup, deleteFillup } from "@/lib/actions/fillups";
import type { Segment } from "@/lib/fuel";
import {
  formatCents,
  formatLiters,
  formatKm,
  formatPricePerLiter,
  formatL100,
  formatDatePt,
} from "@/lib/format";
import { FillupForm } from "./FillupForm";

type Row = {
  id: string;
  fillDate: string;
  odometerKm: number;
  litersMl: number;
  totalCents: number;
  isFull: boolean;
  station: string | null;
  walletaSyncedAt: Date | null;
  segment: Segment | null;
};

export function FillupList({
  fillups,
  walletaEnabled,
}: {
  fillups: Row[];
  walletaEnabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);

  if (fillups.length === 0) {
    return (
      <section className="rounded-3xl border border-hairline bg-surface p-8 text-center text-sm text-muted">
        No fill-ups yet. Add the first one above — averages appear after the
        second full tank.
      </section>
    );
  }

  async function onDelete(row: Row) {
    if (!window.confirm(`Delete the fill-up of ${formatDatePt(row.fillDate)}?`)) {
      return;
    }
    await deleteFillup(row.id);
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">History</h2>
      <ul className="divide-y divide-hairline overflow-hidden rounded-3xl border border-hairline bg-surface">
        {fillups.map((f) => (
          <li key={f.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium">{formatDatePt(f.fillDate)}</span>
                {f.station && <span className="text-muted">{f.station}</span>}
                {!f.isFull && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    partial
                  </span>
                )}
                {walletaEnabled && f.walletaSyncedAt && (
                  <span
                    className="flex items-center gap-0.5 text-xs text-good"
                    title="Sent to Walleta"
                  >
                    <Check className="h-3 w-3" /> Walleta
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                <span>{formatLiters(f.litersMl)}</span>
                <span>{formatPricePerLiter(f.totalCents, f.litersMl)}</span>
                <span>{formatKm(f.odometerKm)}</span>
                {f.segment && (
                  <span className="font-medium text-data-blue">
                    {formatL100(f.segment.l100)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm font-semibold">
              {formatCents(f.totalCents)}
            </div>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => setEditing(f)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(f)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-over"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <EditDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-hairline bg-surface p-5 pb-safe shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted">
            Edit fill-up · {formatDatePt(row.fillDate)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <FillupForm
          initial={{
            fillDate: row.fillDate,
            odometerKm: row.odometerKm,
            liters: row.litersMl / 1000,
            totalEuros: row.totalCents / 100,
            isFull: row.isFull,
            station: row.station ?? undefined,
          }}
          walletaEnabled={false}
          showWalletaToggle={false}
          submitLabel="Save"
          onSubmit={(values) => updateFillup(row.id, values)}
          onDone={onSaved}
        />
        {row.walletaSyncedAt && (
          <p className="mt-3 text-xs text-muted">
            Already sent to Walleta — edits here don&apos;t update it there.
          </p>
        )}
      </div>
    </div>
  );
}
