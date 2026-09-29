import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, type TrackerUser } from "@/lib/tracker-store";

export const SESSION_COOKIE = "tracker_session";

export async function currentSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function currentUser(): Promise<TrackerUser | null> {
  const token = await currentSessionToken();
  return getSessionUser(token);
}

export async function requireUser(): Promise<TrackerUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  roles: TrackerUser["role"][],
  redirectTo = "/app/overview",
): Promise<TrackerUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<TrackerUser> {
  return requireRole(["SUPER_ADMIN", "ADMIN"], "/app/overview");
}

export async function requireSuperAdmin(): Promise<TrackerUser> {
  return requireRole(["SUPER_ADMIN"], "/app/overview");
}

export async function requireEditor(): Promise<TrackerUser> {
  return requireRole(["SUPER_ADMIN", "ADMIN", "EDITOR"], "/app/overview");
}
