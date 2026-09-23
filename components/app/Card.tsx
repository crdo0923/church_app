import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-white p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-[13px] font-semibold tracking-tight text-navy-900">{children}</h2>;
}
