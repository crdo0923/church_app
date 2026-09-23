import { Bell, Search } from "lucide-react";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-white px-5 py-3">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight text-navy-900">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
      </div>
      <label className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted md:flex">
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span>
          Search <kbd className="rounded border border-border bg-white px-1 font-mono">⌘K</kbd>
        </span>
      </label>
      <span className="hidden rounded border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted sm:inline">
        production
      </span>
      <button
        type="button"
        aria-label="Notifications"
        className="rounded-md border border-border p-2 text-muted transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden />
      </button>
      <span
        aria-label="User profile"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white"
      >
        RC
      </span>
    </header>
  );
}
