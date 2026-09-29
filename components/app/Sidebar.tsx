import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, APP_NAME, APP_SUBTITLE, NAV_ITEMS } from "@/lib/constants";
import {
  Activity,
  BookOpen,
  Boxes,
  FlaskConical,
  LayoutDashboard,
  Map,
  Monitor,
  Plug,
  Rocket,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const ICONS = {
  LayoutDashboard,
  Boxes,
  Map,
  Monitor,
  Plug,
  ShieldCheck,
  Rocket,
  FlaskConical,
  BookOpen,
  Users,
  Activity,
  Settings,
} as const;

function NavList({ items, activePath, label }: { items: readonly { href: string; label: string; icon: string }[]; activePath?: string; label: string }) {
  return (
    <nav aria-label={label} className="space-y-0.5 p-2">
      {items.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        const active = activePath === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-accent-soft text-primary"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export function Sidebar({ activePath, showAdmin }: { activePath?: string; showAdmin?: boolean }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm font-semibold tracking-tight text-navy-900">{APP_NAME}</p>
        <p className="mt-0.5 text-xs text-muted">{APP_SUBTITLE}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pb-0 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted">Project</p>
        <NavList items={NAV_ITEMS} activePath={activePath} label="Project" />
        {showAdmin ? (
          <>
            <div aria-hidden className="mx-3 my-1 border-t border-border" />
            <p className="px-4 pb-0 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted">Administration</p>
            <NavList items={ADMIN_NAV_ITEMS} activePath={activePath} label="Administration" />
          </>
        ) : null}
      </div>
      <div className="border-t border-border p-3 text-xs text-muted">
        <p className="font-medium text-foreground">Roadmap tracker</p>
        <p className="mt-0.5">Human-maintained · no auto-sync</p>
      </div>
    </aside>
  );
}
