import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  neutral: "bg-secondary text-foreground/80",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  arch: "bg-accent-soft text-arch",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-transparent px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
