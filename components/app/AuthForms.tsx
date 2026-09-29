"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function postAction(action: string, payload: Record<string, unknown>) {
  const res = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; mustChangePassword?: boolean };
  if (!data.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await postAction("login", { email, password });
      router.push("/app/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2.5" aria-label="Sign in">
      <label className="block text-xs font-medium">
        Email
        <input
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@church.org"
          className="mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]"
        />
      </label>
      <label className="block text-xs font-medium">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]"
        />
      </label>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-soft/50 px-2.5 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function SetupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, bootstrapPassword }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Setup failed.");
      router.push("/app/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]";
  return (
    <form onSubmit={submit} className="mt-4 space-y-2.5" aria-label="Initial administrator setup">
      <label className="block text-xs font-medium">
        Full name
        <input required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        Email
        <input required maxLength={254} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        New password (12+ characters)
        <input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        Bootstrap password
        <input required type="password" autoComplete="off" value={bootstrapPassword} onChange={(e) => setBootstrapPassword(e.target.value)} placeholder="From server environment" className={input} />
      </label>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-soft/50 px-2.5 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {busy ? "Creating administrator…" : "Create administrator"}
      </button>
    </form>
  );
}

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await postAction("accept-invite", { token, fullName, password });
      router.push("/app/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invitation.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]";
  return (
    <form onSubmit={submit} className="mt-4 space-y-2.5" aria-label="Accept invitation">
      <label className="block text-xs font-medium">
        Full name
        <input required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
      </label>
      <label className="block text-xs font-medium">
        Choose a password (12+ characters)
        <input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
      </label>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/20 bg-danger-soft/50 px-2.5 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-navy-900 px-3 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {busy ? "Creating account…" : "Create account & sign in"}
      </button>
    </form>
  );
}
