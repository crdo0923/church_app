import { z } from "zod";

export const trackerRoles = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"] as const;
export type TrackerRole = (typeof trackerRoles)[number];

export const accountStatuses = ["ACTIVE", "SUSPENDED", "INVITED", "DISABLED"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const itemStatuses = [
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "COMPLETED",
  "REOPENED",
] as const;
export type ItemStatus = (typeof itemStatuses)[number];

export const taskStatuses = [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "REOPENED",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const criterionCategories = [
  "FUNCTIONAL",
  "UX_UI",
  "SECURITY",
  "DATA",
  "TESTING",
  "PERFORMANCE",
  "DOCUMENTATION",
  "DEPLOYMENT",
  "ACCESSIBILITY",
] as const;

export const requirementLevels = ["REQUIRED", "OPTIONAL", "NOT_APPLICABLE"] as const;

export const progressSources = ["CALCULATED", "MANUAL"] as const;

/** Role hierarchy: higher number = more privilege. */
export const ROLE_RANK: Record<TrackerRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export function canEdit(role: TrackerRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.EDITOR;
}

export function canManageUsers(role: TrackerRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.ADMIN;
}

export function canAccessAdmin(role: TrackerRole): boolean {
  return role === "SUPER_ADMIN";
}

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const adminSetupSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  password: z.string().min(12).max(256),
  bootstrapPassword: z.string().min(1).max(256),
});

export const inviteUserSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
  notes: z.string().max(2000).optional().default(""),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(16).max(256),
  fullName: z.string().min(1).max(120),
  password: z.string().min(12).max(256),
});

export const createUserSchema = inviteUserSchema.extend({
  password: z.string().min(12).max(256).optional(),
});

export const changeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(trackerRoles),
});

export const changeStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(accountStatuses),
  reason: z.string().max(2000).optional().default(""),
});

export const projectUpdateSchema = z.object({
  projectStatus: z.enum([
    "PLANNING",
    "ON_TRACK",
    "AT_RISK",
    "BLOCKED",
    "ON_HOLD",
    "COMPLETED",
  ]),
  currentPhaseNumber: z.string().regex(/^\d{2}$/),
  overallProgress: z.number().int().min(0).max(100),
  progressSource: z.enum(progressSources).default("MANUAL"),
  currentFocus: z.string().max(500).default(""),
  whatChanged: z.string().max(4000).default(""),
  whatsNext: z.string().max(4000).default(""),
  blockerNote: z.string().max(2000).default(""),
  updateNote: z.string().max(4000).default(""),
});

export const criterionInputSchema = z.object({
  label: z.string().min(1).max(500),
  category: z.enum(criterionCategories).default("FUNCTIONAL"),
  requirement: z.enum(requirementLevels).default("REQUIRED"),
  status: z.enum(["COMPLETE", "INCOMPLETE", "NOT_APPLICABLE"]).default("INCOMPLETE"),
  notes: z.string().max(2000).default(""),
});

export const taskUpsertSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().max(2000).default(""),
  description: z.string().max(10000).default(""),
  owner: z.string().max(200).default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(taskStatuses).default("BACKLOG"),
  targetDate: z.string().max(30).default(""),
  dependencies: z.string().max(4000).default(""),
  technicalNotes: z.string().max(10000).default(""),
});

export const statusChangeSchema = z.object({
  status: z.enum([...taskStatuses, ...itemStatuses]),
  note: z.string().max(4000).default(""),
  overrideReason: z.string().max(4000).default(""),
});

export const evidenceInputSchema = z.object({
  kind: z.enum(["URL", "NOTE", "PR", "DOCUMENT", "TEST_RESULT", "DEPLOYMENT"]),
  label: z.string().min(1).max(300),
  url: z.string().max(2000).default(""),
  text: z.string().max(4000).default(""),
});

export const commentInputSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const completionReviewSchema = z.object({
  approved: z.boolean(),
  completionNotes: z.string().max(4000).default(""),
  overrideReason: z.string().max(4000).default(""),
});
