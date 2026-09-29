import { NextResponse } from "next/server";
import { requireEditor, requireAdmin, requireSuperAdmin, currentUser } from "@/lib/auth";
import {
  addCriterion,
  addComment,
  addEvidence,
  audit,
  createUser,
  listUsers,
  recordCompletion,
  saveProjectUpdate,
  seedSnapshot,
  setCriterionStatus,
  setItemStatus,
} from "@/lib/tracker-store";
import { ensureSchema, getSql } from "@/lib/pg";
import { newId, nowIso, hashToken, hashPasswordAsync } from "@/lib/tracker-db";
import {
  changeRoleSchema,
  changeStatusSchema,
  commentInputSchema,
  completionReviewSchema,
  criterionInputSchema,
  createUserSchema,
  evidenceInputSchema,
  inviteUserSchema,
  projectUpdateSchema,
  statusChangeSchema,
  taskUpsertSchema,
} from "@/lib/validation";

function deny(message: string, status = 403) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!(await ensureSchema())) {
    return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
  }
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
  const me = await currentUser();
  if (!me) return deny("Sign in required.", 401);
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const actor = { id: me.id, email: me.email };

  /* ---- seed (editor+) ---- */
  if (resource === "seed") {
    await requireEditor();
    const result = await seedSnapshot();
    await audit({ actorId: me.id, actorEmail: me.email, action: "seed.run", entity: "system", entityId: "seed" });
    return NextResponse.json({ ok: true, ...result });
  }

  /* ---- project update (editor+) ---- */
  if (resource === "project-update") {
    await requireEditor();
    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Check the update fields and try again." }, { status: 400 });
    const result = await saveProjectUpdate({ ...parsed.data, actorId: me.id, actorEmail: me.email });
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  /* ---- status change (editor+) ---- */
  if (resource === "status") {
    await requireEditor();
    const parsed = statusChangeSchema.safeParse((body as Record<string, unknown>) ?? {});
    const { entityType, entityId } = (body as { entityType?: string; entityId?: string }) ?? {};
    if (!parsed.success || !entityType || !entityId)
      return NextResponse.json({ ok: false, error: "Status and item reference are required." }, { status: 400 });
    if ((parsed.data.status === "DONE" || parsed.data.status === "COMPLETED") && !parsed.data.overrideReason) {
      // Completion must flow through the completion review endpoint (§9); direct DONE is blocked.
      return NextResponse.json(
        { ok: false, error: "Marking complete requires the completion review. Use the completion gate." },
        { status: 409 },
      );
    }
    const et = entityType as "phase" | "milestone" | "task";
    const result = await setItemStatus(et, entityId, parsed.data.status, actor, parsed.data.note);
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  /* ---- completion review (editor+) ---- */
  if (resource === "completion") {
    await requireEditor();
    const { entityType, entityId } = (body as { entityType?: string; entityId?: string }) ?? {};
    const parsed = completionReviewSchema.safeParse((body as Record<string, unknown>) ?? {});
    if (!parsed.success || !entityType || !entityId)
      return NextResponse.json({ ok: false, error: "Approval decision and item reference are required." }, { status: 400 });
    const action = (body as { reopen?: boolean })?.reopen
      ? "REOPENED"
      : parsed.data.overrideReason
        ? "OVERRIDE_COMPLETED"
        : "COMPLETED";
    if (!(body as { reopen?: boolean })?.reopen && !parsed.data.approved)
      return NextResponse.json({ ok: false, error: "Review was not approved — item stays in progress." }, { status: 409 });
    const et = entityType as "phase" | "milestone" | "task";
    const result = await recordCompletion(et, entityId, action, parsed.data.completionNotes, parsed.data.overrideReason, actor);
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true, action });
  }

  /* ---- criteria (editor+) ---- */
  if (resource === "criterion") {
    await requireEditor();
    const { entityType, entityId, status, criterionId } = (body as Record<string, string>) ?? {};
    if (criterionId && status) {
      if (!["COMPLETE", "INCOMPLETE", "NOT_APPLICABLE"].includes(status))
        return NextResponse.json({ ok: false, error: "Invalid criterion status." }, { status: 400 });
      const result = await setCriterionStatus(criterionId, status as "COMPLETE", actor);
      if (!result.ok) return NextResponse.json(result, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    const parsed = criterionInputSchema.safeParse((body as Record<string, unknown>) ?? {});
    if (!parsed.success || !entityType || !entityId)
      return NextResponse.json({ ok: false, error: "Criterion label and item reference are required." }, { status: 400 });
    const result = await addCriterion({
      entityType: entityType as "phase" | "milestone" | "task",
      entityId,
      label: parsed.data.label,
      category: parsed.data.category,
      requirement: parsed.data.requirement,
      actorId: me.id,
      actorEmail: me.email,
    });
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  /* ---- evidence (editor+) ---- */
  if (resource === "evidence") {
    await requireEditor();
    const { entityType, entityId } = (body as Record<string, string>) ?? {};
    const parsed = evidenceInputSchema.safeParse((body as Record<string, unknown>) ?? {});
    if (!parsed.success || !entityType || !entityId)
      return NextResponse.json({ ok: false, error: "Evidence label and item reference are required." }, { status: 400 });
    const result = await addEvidence({ entityType, entityId, ...parsed.data, actorId: me.id, actorEmail: me.email });
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  /* ---- comments (any signed-in user) ---- */
  if (resource === "comment") {
    const { entityType, entityId } = (body as Record<string, string>) ?? {};
    const parsed = commentInputSchema.safeParse((body as Record<string, unknown>) ?? {});
    if (!parsed.success || !entityType || !entityId)
      return NextResponse.json({ ok: false, error: "Comment text and item reference are required." }, { status: 400 });
    const result = await addComment(entityType, entityId, parsed.data.body, actor);
    if (!result.ok) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  /* ---- manual progress (editor+) ---- */
  if (resource === "manual-progress") {
    await requireEditor();
    const { entityType, entityId, percent } = (body as Record<string, unknown>) ?? {};
    const pct = Number(percent);
    if ((entityType !== "phase" && entityType !== "milestone") || typeof entityId !== "string" || !Number.isFinite(pct))
      return NextResponse.json({ ok: false, error: "Item reference and a 0–100 percent are required." }, { status: 400 });
    const clamped = Math.min(100, Math.max(0, Math.round(pct)));
    await sql`
      INSERT INTO roadmapchurch.manual_progress (entity_type, entity_id, percent, updated_by, updated_at)
      VALUES (${String(entityType)}, ${entityId}, ${clamped}, ${me.id}, ${nowIso()})
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET percent=EXCLUDED.percent, updated_by=EXCLUDED.updated_by, updated_at=EXCLUDED.updated_at
    `;
    await audit({ actorId: me.id, actorEmail: me.email, action: "progress.manual", entity: String(entityType), entityId, metadata: { percent: clamped } });
    return NextResponse.json({ ok: true, percent: clamped });
  }

  /* ---- tasks (editor+) ---- */
  if (resource === "task") {
    await requireEditor();
    const { phaseNumber, milestoneId } = (body as Record<string, string>) ?? {};
    const parsed = taskUpsertSchema.safeParse((body as Record<string, unknown>) ?? {});
    if (!parsed.success || !phaseNumber)
      return NextResponse.json({ ok: false, error: "Task title and phase are required." }, { status: 400 });
    const id = newId();
    await sql`
      INSERT INTO roadmapchurch.tasks (id, phase_number, milestone_id, title, summary, description, owner, priority, target_date, dependencies, technical_notes, created_by, created_at, updated_at)
      VALUES (${id}, ${phaseNumber}, ${milestoneId ?? ""}, ${parsed.data.title}, ${parsed.data.summary}, ${parsed.data.description}, ${parsed.data.owner}, ${parsed.data.priority}, ${parsed.data.targetDate}, ${parsed.data.dependencies}, ${parsed.data.technicalNotes}, ${me.id}, ${nowIso()}, ${nowIso()})
    `;
    await audit({ actorId: me.id, actorEmail: me.email, action: "task.created", entity: "task", entityId: id, metadata: { title: parsed.data.title, phase: phaseNumber } });
    return NextResponse.json({ ok: true, id });
  }

  /* ---- users (admin+) ---- */
  if (resource === "user") {
    const { op } = (body as Record<string, string>) ?? {};
    if (op === "invite" || op === "create") {
      await requireAdmin();
      const schema = op === "invite" ? inviteUserSchema : createUserSchema;
      const parsed = schema.safeParse((body as Record<string, unknown>) ?? {});
      if (!parsed.success) return NextResponse.json({ ok: false, error: "Name, valid email, and role are required." }, { status: 400 });
      if (op === "invite") {
        const token = newId() + newId();
        const id = newId();
        const now = nowIso();
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
        await sql`
          INSERT INTO roadmapchurch.invites (id, email, full_name, role, notes, token_hash, created_by, created_at, expires_at)
          VALUES (${id}, ${parsed.data.email.toLowerCase()}, ${parsed.data.fullName}, ${parsed.data.role}, ${parsed.data.notes ?? ""}, ${hashToken(token)}, ${me.id}, ${now}, ${expires})
        `;
        await audit({ actorId: me.id, actorEmail: me.email, action: "user.invited", entity: "user", entityId: id, metadata: { email: parsed.data.email.toLowerCase(), role: parsed.data.role } });
        return NextResponse.json({ ok: true, inviteToken: token, inviteId: id });
      }
      const created = await createUser({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        role: parsed.data.role as "ADMIN" | "EDITOR" | "VIEWER",
        notes: parsed.data.notes ?? "",
        password: (parsed.data as { password?: string }).password,
        actorId: me.id,
        actorEmail: me.email,
      });
      if (!created.ok) return NextResponse.json(created, { status: 409 });
      return NextResponse.json({ ok: true, id: created.user?.id });
    }
    if (op === "role") {
      await requireAdmin();
      const parsed = changeRoleSchema.safeParse((body as Record<string, unknown>) ?? {});
      if (!parsed.success) return NextResponse.json({ ok: false, error: "User and role are required." }, { status: 400 });
      if (parsed.data.role === "SUPER_ADMIN") return deny("Super Admin can only be assigned during initial setup.");
      const users = await listUsers();
      const target = users.find((u) => u.id === parsed.data.userId);
      if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
      if (target.role === "SUPER_ADMIN") return deny("The Super Admin role cannot be changed here.");
      if (target.id === me.id) return deny("You cannot change your own role.");
      await sql`UPDATE roadmapchurch.users SET role=${parsed.data.role}, updated_at=${nowIso()} WHERE id=${target.id}`;
      await audit({ actorId: me.id, actorEmail: me.email, action: "user.role_changed", entity: "user", entityId: target.id, metadata: { from: target.role, to: parsed.data.role } });
      return NextResponse.json({ ok: true });
    }
    if (op === "status") {
      await requireAdmin();
      const parsed = changeStatusSchema.safeParse((body as Record<string, unknown>) ?? {});
      if (!parsed.success) return NextResponse.json({ ok: false, error: "User and status are required." }, { status: 400 });
      const users = await listUsers();
      const target = users.find((u) => u.id === parsed.data.userId);
      if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
      if (target.role === "SUPER_ADMIN" && parsed.data.status !== "ACTIVE")
        return deny("The Super Admin account cannot be suspended or disabled here.");
      if (target.id === me.id) return deny("You cannot change your own status.");
      await sql`UPDATE roadmapchurch.users SET status=${parsed.data.status}, updated_at=${nowIso()} WHERE id=${target.id}`;
      await sql`DELETE FROM roadmapchurch.sessions WHERE user_id=${target.id}`;
      await audit({ actorId: me.id, actorEmail: me.email, action: "user.status_changed", entity: "user", entityId: target.id, metadata: { from: target.status, to: parsed.data.status, reason: parsed.data.reason } });
      return NextResponse.json({ ok: true });
    }
    if (op === "reset-password") {
      await requireSuperAdmin();
      const { userId } = (body as Record<string, string>) ?? {};
      const users = await listUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
      const temp = newId().replace(/-/g, "").slice(0, 16);
      await sql`UPDATE roadmapchurch.users SET password_hash=${await hashPasswordAsync(temp)}, must_change_password=1, updated_at=${nowIso()} WHERE id=${target.id}`;
      await sql`DELETE FROM roadmapchurch.sessions WHERE user_id=${target.id}`;
      await audit({ actorId: me.id, actorEmail: me.email, action: "user.password_reset", entity: "user", entityId: target.id });
      return NextResponse.json({ ok: true, temporaryPassword: temp });
    }
    return NextResponse.json({ ok: false, error: "Unknown user operation." }, { status: 400 });
  }

  return NextResponse.json({ ok: false, error: "Unknown resource." }, { status: 404 });
}
