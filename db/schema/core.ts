import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

/* Enums — mirror spec §33 statuses + supporting vocab */
export const projectStatus = pgEnum("project_status", [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "RELEASE_CANDIDATE",
  "PRODUCTION",
  "MAINTENANCE",
  "ARCHIVED",
]);
export const phaseStatus = pgEnum("phase_status", [
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "BLOCKED",
  "AT_RISK",
  "COMPLETED",
]);
export const milestoneStatus = pgEnum("milestone_status", [
  "PLANNED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
]);
export const taskStatus = pgEnum("task_status", [
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
]);
export const taskPriority = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const memberRole = pgEnum("member_role", [
  "owner",
  "admin",
  "architect",
  "project_manager",
  "engineer",
  "designer",
  "qa",
  "viewer",
]);
export const memberStatus = pgEnum("member_status", ["invited", "active", "suspended"]);
export const adrStatus = pgEnum("adr_status", ["proposed", "accepted", "rejected", "superseded"]);
export const riskStatus = pgEnum("risk_status", ["open", "monitoring", "mitigated", "closed"]);
export const integrationStatus = pgEnum("integration_status", [
  "PLANNED",
  "CONFIGURING",
  "CONNECTED",
  "HEALTHY",
  "DEGRADED",
  "DISABLED",
]);
export const envName = pgEnum("env_name", ["local", "development", "preview", "staging", "production"]);
export const deploymentStatus = pgEnum("deployment_status", [
  "QUEUED",
  "BUILDING",
  "READY",
  "FAILED",
  "CANCELED",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};
const audit = {
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

/* Identity + workspace */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: text("settings"),
  ...timestamps,
  ...audit,
});

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: memberRole("role").notNull().default("viewer"),
  status: memberStatus("status").notNull().default("invited"),
  ...timestamps,
});

/* Delivery */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  status: projectStatus("status").notNull().default("PLANNING"),
  currentPhaseId: uuid("current_phase_id"),
  releaseTargetDate: timestamp("release_target_date", { withTimezone: true }),
  ...timestamps,
  ...audit,
});

export const roadmapPhases = pgTable("roadmap_phases", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: uuid("project_id").notNull(),
  number: text("number").notNull(),
  name: text("name").notNull(),
  status: phaseStatus("status").notNull().default("PLANNED"),
  ownerId: uuid("owner_id"),
  startDate: timestamp("start_date", { withTimezone: true }),
  targetDate: timestamp("target_date", { withTimezone: true }),
  ...timestamps,
  ...audit,
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  phaseId: uuid("phase_id").notNull(),
  title: text("title").notNull(),
  successCriteria: text("success_criteria").array(),
  status: milestoneStatus("status").notNull().default("PLANNED"),
  ownerId: uuid("owner_id"),
  targetDate: timestamp("target_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
  ...audit,
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  phaseId: uuid("phase_id").notNull(),
  milestoneId: uuid("milestone_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatus("status").notNull().default("BACKLOG"),
  priority: taskPriority("priority").notNull().default("MEDIUM"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  githubRepo: text("github_repo"),
  githubIssueNumber: text("github_issue_number"),
  githubPrNumber: text("github_pr_number"),
  githubUrl: text("github_url"),
  docUrl: text("doc_url"),
  ...timestamps,
  ...audit,
});

export const taskAssignees = pgTable("task_assignees", {
  taskId: uuid("task_id").notNull(),
  userId: uuid("user_id").notNull(),
  ...timestamps,
});

export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromTaskId: uuid("from_task_id").notNull(),
  toTaskId: uuid("to_task_id").notNull(),
  type: text("type").notNull().default("depends_on"),
  ...timestamps,
  ...audit,
});

export const phaseDependencies = pgTable("phase_dependencies", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromPhaseId: uuid("from_phase_id").notNull(),
  toPhaseId: uuid("to_phase_id").notNull(),
  ...timestamps,
  ...audit,
});

/* Knowledge */
export const risks = pgTable("risks", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  projectId: uuid("project_id"),
  title: text("title").notNull(),
  description: text("description"),
  probability: text("probability"),
  impact: text("impact"),
  mitigation: text("mitigation"),
  status: riskStatus("status").notNull().default("open"),
  ownerId: uuid("owner_id"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  ...timestamps,
  ...audit,
});

export const technicalDecisions = pgTable("technical_decisions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  projectId: uuid("project_id"),
  adrNumber: text("adr_number").notNull(),
  title: text("title").notNull(),
  status: adrStatus("status").notNull().default("proposed"),
  context: text("context"),
  decision: text("decision"),
  consequences: text("consequences"),
  alternatives: text("alternatives"),
  authorId: uuid("author_id"),
  ...timestamps,
  ...audit,
});

export const architectureComponents = pgTable("architecture_components", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  projectId: uuid("project_id"),
  layer: text("layer").notNull(),
  name: text("name").notNull(),
  tech: text("tech"),
  ownerId: uuid("owner_id"),
  docUrl: text("doc_url"),
  ...timestamps,
  ...audit,
});

export const technologyStackItems = pgTable("technology_stack_items", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  purpose: text("purpose"),
  status: text("status").notNull().default("PLANNED"),
  ...timestamps,
  ...audit,
});

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  provider: text("provider").notNull(),
  category: text("category"),
  status: integrationStatus("status").notNull().default("PLANNED"),
  ownerId: uuid("owner_id"),
  docsUrl: text("docs_url"),
  ...timestamps,
  ...audit,
});

/* Operations */
export const environments = pgTable("environments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  name: envName("name").notNull(),
  description: text("description"),
  ...timestamps,
  ...audit,
});

export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  environmentId: uuid("environment_id").notNull(),
  version: text("version"),
  commitSha: text("commit_sha"),
  status: deploymentStatus("status").notNull().default("QUEUED"),
  url: text("url"),
  deployedAt: timestamp("deployed_at", { withTimezone: true }),
  ...timestamps,
  ...audit,
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  projectId: uuid("project_id"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  category: text("category"),
  version: text("version").notNull().default("1.0.0"),
  contentMd: text("content_md"),
  authorId: uuid("author_id"),
  ...timestamps,
  ...audit,
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  body: text("body").notNull(),
  authorId: uuid("author_id"),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  readAt: timestamp("read_at", { withTimezone: true }),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: uuid("workspace_id").notNull(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
