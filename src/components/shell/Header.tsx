"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Fuel, LogOut, Moon, Sun } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function Header({ userName }: { userName: string }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  async function onSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white">
          <Fuel className="h-4.5 w-4.5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Tanque</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-2 hidden text-sm text-muted sm:block">{userName}</span>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Toggle theme"
        >
          <Sun className="h-4.5 w-4.5 dark:hidden" />
          <Moon className="hidden h-4.5 w-4.5 dark:block" />
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Sign out"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
