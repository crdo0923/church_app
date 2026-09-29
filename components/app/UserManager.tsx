"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/app/Badge";
import { Card, CardHeading } from "@/components/app/Card";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  notes: string;
  createdAt: string;
}

async function postUser(payload: Record<string, unknown>) {
  const res = await fetch("/api/actions/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; inviteToken?: string; temporaryPassword?: string };
  if (!data.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export function UserManager({ users, me }: { users: UserRow[]; me: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"invite" | "create">("invite");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [reason, setReason] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await postUser(
        tab === "invite"
          ? { op: "invite", fullName, email, role, notes }
          : { op: "create", fullName, email, role, notes, password: password || undefined },
      );
      if (data.inviteToken) {
        const link = `${window.location.origin}/login?invite=${data.inviteToken}`;
        setResult(`Invitation created. Share this link (it will not be shown again): ${link}`);
      } else {
        setResult("Account created.");
      }
      setFullName("");
      setEmail("");
      setNotes("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function change(id: string, op: "role" | "status" | "reset-password", value: string) {
    setError("");
    setResult("");
    try {
      const data = await postUser(
        op === "role"
          ? { op, userId: id, role: value }
          : op === "status"
            ? { op, userId: id, status: value, reason }
            : { op, userId: id },
      );
      if (data.temporaryPassword) setResult(`Temporary password (share once, then it is gone): ${data.temporaryPassword}`);
      else setResult("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  const input = "mt-1 w-full rounded-md border border-border bg-white px-2.5 py-2 text-[13px]";
  return (
    <div className="space-y-4">
      <Card>
        <CardHeading>{tab === "invite" ? "Invite user (preferred)" : "Create user directly"}</CardHeading>
        <div className="mt-2 flex gap-2 text-xs">
          <button type="button" onClick={() => setTab("invite")} aria-pressed={tab === "invite"} className={`rounded-md border px-2.5 py-1.5 ${tab === "invite" ? "border-navy-900 bg-navy-900 text-white" : "border-border"}`}>
            Invite
          </button>
          <button type="button" onClick={() => setTab("create")} aria-pressed={tab === "create"} className={`rounded-md border px-2.5 py-1.5 ${tab === "create" ? "border-navy-900 bg-navy-900 text-white" : "border-border"}`}>
            Create
          </button>
        </div>
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium">Full name<input required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} /></label>
          <label className="block text-xs font-medium">Email<input required maxLength={254} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
          <label className="block text-xs font-medium">Role
            <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
              <option value="ADMIN">Admin — manage roadmap & users</option>
              <option value="EDITOR">Editor — update roadmap content</option>
              <option value="VIEWER">Viewer — read-only</option>
            </select>
          </label>
          {tab === "create" ? (
            <label className="block text-xs font-medium">Password (optional, 12+ chars — otherwise invite them)<input type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></label>
          ) : null}
          <label className="block text-xs font-medium sm:col-span-2">Notes<textarea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={input} /></label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="inline-flex min-h-[44px] items-center rounded-md bg-navy-900 px-4 text-[13px] font-medium text-white disabled:opacity-60">
              {busy ? "Saving…" : tab === "invite" ? "Send invitation" : "Create account"}
            </button>
          </div>
        </form>
        {error ? <p role="alert" className="mt-2 text-xs text-danger">{error}</p> : null}
        {result ? <p role="status" className="mt-2 break-all rounded-md border border-border bg-background px-2.5 py-2 text-xs">{result}</p> : null}
        <p className="mt-2 text-[11px] text-muted">You never see user passwords. Invited users choose their own.</p>
      </Card>

      <Card>
        <CardHeading>Accounts</CardHeading>
        <label className="mt-2 block max-w-xs text-xs font-medium">
          Reason recorded with status changes
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} placeholder="e.g. Offboarded from team" className={input} />
        </label>
        <ul className="mt-3 space-y-2">
          {users.map((u) => (
            <li key={u.id} className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px]">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {u.fullName} <Badge tone="neutral">{u.role.replace(/_/g, " ")}</Badge> <Badge tone={u.status === "ACTIVE" ? "success" : "warning"}>{u.status}</Badge>
              </p>
              <p className="text-xs text-muted">{u.email} · since {new Date(u.createdAt).toLocaleDateString()}</p>
              {u.id !== me && u.role !== "SUPER_ADMIN" ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <select aria-label={`Change role for ${u.fullName}`} defaultValue={u.role} onChange={(e) => change(u.id, "role", e.target.value)} className="rounded-md border border-border bg-white px-2 py-1.5">
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <select aria-label={`Change status for ${u.fullName}`} defaultValue={u.status} onChange={(e) => change(u.id, "status", e.target.value)} className="rounded-md border border-border bg-white px-2 py-1.5">
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                  <button type="button" onClick={() => change(u.id, "reset-password", "")} className="rounded-md border border-border px-2 py-1.5">Reset access</button>
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-muted">{u.id === me ? "This is you." : "Super Admin — managed at setup."}</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
