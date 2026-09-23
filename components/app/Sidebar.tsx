import { cn } from "@/lib/utils";
import { APP_NAME, APP_SUBTITLE, NAV_ITEMS } from "@/lib/constants";
import {
  Activity,
  BookOpen,
  Boxes,
  Database,
  FlaskConical,
  LayoutDashboard,
  Map,
  Monitor,
  Plug,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const ICONS = {
  LayoutDashboard,
  Boxes,
  Map,
  Monitor,
  Server,
  Database,
  Plug,
  ShieldCheck,
  Rocket,
  FlaskConical,
  BookOpen,
  Users,
  Activity,
  Settings,
} as const;

export function Sidebar({ activePath }: { activePath?: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-4 py-4">
        <p className="text-sm font-semibold tracking-tight text-navy-900">{APP_NAME}</p>
        <p className="mt-0.5 text-xs text-muted">{APP_SUBTITLE}</p>
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const active = activePath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
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
      <div className="border-t border-border p-3 text-xs text-muted">
        <p className="font-medium text-foreground">Church Leadership LMS</p>
        <p className="mt-0.5">Workspace · Production</p>
      </div>
    </aside>
  );
}
