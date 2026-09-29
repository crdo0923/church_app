import { NextResponse } from "next/server";
import {
  audit,
  createSession,
  findUserByEmail,
  verifyUserPassword,
} from "@/lib/tracker-store";
import { ensureSchema, getSql } from "@/lib/pg";
import { newId, nowIso, hashToken, hashPassword } from "@/lib/tracker-db";
import { acceptInviteSchema, adminSetupSchema, loginSchema } from "@/lib/validation";
import { SESSION_COOKIE } from "@/lib/auth";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};

function setSession(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
  return res;
}

function dbUnavailable() {
  return NextResponse.json(
    { ok: false, error: "Database unavailable. Set DATABASE_URL and reload." },
    { status: 503 },
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!(await ensureSchema())) return dbUnavailable();
  const sql = getSql();
  if (!sql) return dbUnavailable();

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (action === "login") {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400 });
    const user = await findUserByEmail(parsed.data.email);
    if (!user || user.status === "INVITED")
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    if (user.status === "DISABLED" || user.status === "SUSPENDED")
      return NextResponse.json({ ok: false, error: "This account is disabled. Contact an administrator." }, { status: 403 });
    if (!(await verifyUserPassword(user.id, parsed.data.password)))
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    const session = await createSession(user.id);
    if (!session) return NextResponse.json({ ok: false, error: "Could not create session." }, { status: 500 });
    await audit({ actorId: user.id, actorEmail: user.email, action: "auth.login", entity: "user", entityId: user.id });
    return setSession(NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword }), session.token);
  }

  if (action === "logout") {
    const token = req.headers.get("cookie")?.match(/tracker_session=([^;]+)/)?.[1];
    if (token) {
      try {
        await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
      } catch {
        /* best effort */
      }
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
    return res;
  }

  if (action === "setup") {
    const parsed = adminSetupSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ ok: false, error: "Full name, valid email, 12+ character password, and bootstrap password are required." }, { status: 400 });
    const existing = await sql`SELECT COUNT(*)::int AS n FROM users WHERE role='SUPER_ADMIN'`;
    if (Number(existing[0]?.n ?? 0) > 0)
      return NextResponse.json({ ok: false, error: "Administrator setup is already complete." }, { status: 409 });
    const expected = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD ?? "";
    if (!expected || parsed.data.bootstrapPassword !== expected)
      return NextResponse.json({ ok: false, error: "Invalid bootstrap password." }, { status: 403 });
    const id = newId();
    const now = nowIso();
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at)
      VALUES (${id}, ${parsed.data.fullName}, ${parsed.data.email.toLowerCase()}, ${hashPassword(parsed.data.password)}, 'SUPER_ADMIN', 'ACTIVE', 'Initial administrator', 0, ${now}, ${now})
    `;
    await audit({ actorId: id, actorEmail: parsed.data.email.toLowerCase(), action: "admin.setup", entity: "user", entityId: id });
    const session = await createSession(id);
    if (!session) return NextResponse.json({ ok: false, error: "Could not create session." }, { status: 500 });
    return setSession(NextResponse.json({ ok: true }), session.token);
  }

  if (action === "accept-invite") {
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ ok: false, error: "Name, 12+ character password, and a valid invitation are required." }, { status: 400 });
    const invites = await sql`SELECT * FROM invites WHERE token_hash = ${hashToken(parsed.data.token)} LIMIT 1`;
    const invite = invites[0] as Record<string, unknown> | undefined;
    if (!invite || invite.accepted_at)
      return NextResponse.json({ ok: false, error: "This invitation is invalid or already used." }, { status: 400 });
    if (new Date(String(invite.expires_at)).getTime() < Date.now())
      return NextResponse.json({ ok: false, error: "This invitation has expired. Ask an administrator for a new one." }, { status: 400 });
    const taken = await sql`SELECT id FROM users WHERE lower(email)=lower(${String(invite.email)}) LIMIT 1`;
    if (taken[0]) return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    const id = newId();
    const now = nowIso();
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, status, notes, must_change_password, created_at, updated_at)
      VALUES (${id}, ${parsed.data.fullName}, ${String(invite.email).toLowerCase()}, ${hashPassword(parsed.data.password)}, ${String(invite.role)}, 'ACTIVE', ${String(invite.notes ?? "")}, 0, ${now}, ${now})
    `;
    await sql`UPDATE invites SET accepted_at=${now} WHERE id=${String(invite.id)}`;
    await audit({ actorId: id, actorEmail: String(invite.email).toLowerCase(), action: "user.invite_accepted", entity: "user", entityId: id, metadata: { role: String(invite.role) } });
    const session = await createSession(id);
    if (!session) return NextResponse.json({ ok: false, error: "Could not create session." }, { status: 500 });
    return setSession(NextResponse.json({ ok: true }), session.token);
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 404 });
}
