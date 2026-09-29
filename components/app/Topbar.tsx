"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "@/lib/constants";
import type { ReactNode } from "react";

export function Topbar({
  title,
  subtitle,
  user,
  action,
  activePath,
  showAdmin,
}: {
  title: string;
  subtitle?: string;
  user?: { fullName: string; role: string } | null;
  action?: ReactNode;
  activePath?: string;
  showAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const initials = (user?.fullName ?? "–")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 sm:px-5">
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border p-2 text-muted lg:hidden"
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-navy-900">{title}</h1>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
        {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <span
              aria-label={`${user.fullName}, ${user.role}`}
              title={`${user.fullName} · ${user.role}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white"
            >
              {initials}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="hidden rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground sm:block"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </header>
      {action ? <div className="border-b border-border bg-white px-4 py-2 sm:hidden">{action}</div> : null}
      {open ? (
        <div className="border-b border-border bg-white px-3 py-3 lg:hidden">
          <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted">Project</p>
          <nav aria-label="Mobile project" className="mt-1 grid gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={activePath === item.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-md border border-border bg-background px-3 text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>
          {showAdmin ? (
            <>
              <p className="mt-3 px-1 font-mono text-[10px] uppercase tracking-widest text-muted">Administration</p>
              <nav aria-label="Mobile administration" className="mt-1 grid gap-1">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={activePath === item.href ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center rounded-md border border-border bg-background px-3 text-sm font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-md bg-navy-900 text-sm font-medium text-white"
            >
              Sign out ({user.fullName})
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
