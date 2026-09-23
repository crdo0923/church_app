import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";

export function AppShell({
  title,
  subtitle,
  activePath,
  children,
}: {
  title: string;
  subtitle?: string;
  activePath?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <div className="sticky top-0 flex h-screen">
          <Sidebar activePath={activePath} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-5">{children}</main>
      </div>
    </div>
  );
}
