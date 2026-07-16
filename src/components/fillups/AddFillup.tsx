"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addFillup, type FillupActionResult } from "@/lib/actions/fillups";
import { FillupForm } from "./FillupForm";

export function AddFillup({
  walletaEnabled,
  lastOdometerKm,
}: {
  walletaEnabled: boolean;
  lastOdometerKm: number | null;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<{
    text: string;
    tone: "good" | "warn";
  } | null>(null);

  function onDone(result: FillupActionResult) {
    setNotice(
      result.walletaFailed
        ? {
            text: "Saved — but Walleta didn't accept it (check WALLETA_URL/token).",
            tone: "warn",
          }
        : { text: "Fill-up saved.", tone: "good" },
    );
    setTimeout(() => setNotice(null), 4000);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-hairline bg-surface p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted">Add fill-up</h2>
        {lastOdometerKm != null && (
          <span className="text-xs text-muted">
            last odometer: {lastOdometerKm.toLocaleString("pt-PT")} km
          </span>
        )}
      </div>
      <FillupForm
        walletaEnabled={walletaEnabled}
        showWalletaToggle
        submitLabel="Add"
        onSubmit={addFillup}
        onDone={onDone}
      />
      {notice && (
        <p
          className={`mt-3 text-sm ${notice.tone === "warn" ? "text-warn" : "text-good"}`}
        >
          {notice.text}
        </p>
      )}
    </section>
  );
}
