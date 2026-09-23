import { Card, CardHeading } from "@/components/app/Card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900">Church Leadership LMS</p>
        <p className="text-xs text-muted">Engineering Command Center · sign in</p>
        <div className="mt-4 space-y-2.5">
          <label className="block text-xs font-medium">
            Email
            <input type="email" placeholder="you@church.org" disabled aria-disabled className="mt-1 w-full rounded-md border border-border bg-secondary/50 px-2.5 py-2 text-[13px] opacity-70" />
          </label>
          <label className="block text-xs font-medium">
            Password
            <input type="password" placeholder="••••••••" disabled aria-disabled className="mt-1 w-full rounded-md border border-border bg-secondary/50 px-2.5 py-2 text-[13px] opacity-70" />
          </label>
          <button type="button" disabled aria-disabled className="w-full rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white opacity-60">
            Sign in — enabled with Supabase in Phase C
          </button>
          <p className="text-[11px] leading-relaxed text-muted">
            Auth shell only: no credential is accepted yet. Email+password and magic link wire up in Phase C with server-side guards + RLS.
          </p>
        </div>
        <a href="/app/overview" className="mt-3 inline-block text-xs font-medium text-accent">Continue to reference overview →</a>
        <CardHeading><span className="sr-only">Sign in form (disabled reference)</span></CardHeading>
      </Card>
    </div>
  );
}
