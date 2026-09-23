export type PhaseStatus =
  | "PLANNED"
  | "READY"
  | "IN PROGRESS"
  | "BLOCKED"
  | "AT RISK"
  | "COMPLETED";

export interface RoadmapPhase {
  number: string;
  name: string;
  status: PhaseStatus;
  done: number;
  total: number;
  owner: string;
  target: string;
}

/**
 * Static reference snapshot of the 10 build phases (spec §31).
 * Marked as reference data until Supabase + Drizzle persistence lands in Phase D.
 * Progress here is illustrative; Phase D derives it from tasks (done/total).
 */
export const ROADMAP_PHASES: RoadmapPhase[] = [
  { number: "01", name: "Foundation & Product Setup", status: "IN PROGRESS", done: 5, total: 12, owner: "Engineering", target: "Oct 2026" },
  { number: "02", name: "Core LMS & Identity", status: "READY", done: 0, total: 8, owner: "Engineering", target: "Nov 2026" },
  { number: "03", name: "Church & Faculty", status: "PLANNED", done: 0, total: 7, owner: "Product", target: "Nov 2026" },
  { number: "04", name: "Student Management", status: "PLANNED", done: 0, total: 7, owner: "Engineering", target: "Dec 2026" },
  { number: "05", name: "Learning & Assessments", status: "PLANNED", done: 0, total: 8, owner: "Engineering", target: "Jan 2027" },
  { number: "06", name: "Scheduling & Communications", status: "PLANNED", done: 0, total: 7, owner: "Engineering", target: "Jan 2027" },
  { number: "07", name: "Integrations & Automation", status: "PLANNED", done: 0, total: 10, owner: "Integrations", target: "Feb 2027" },
  { number: "08", name: "Reporting & Analytics", status: "PLANNED", done: 0, total: 6, owner: "Engineering", target: "Mar 2027" },
  { number: "09", name: "Security & Compliance", status: "PLANNED", done: 0, total: 9, owner: "Security", target: "Mar 2027" },
  { number: "10", name: "Production & Operations", status: "PLANNED", done: 0, total: 9, owner: "DevOps", target: "Apr 2027" },
];

export const ARCHITECTURE_LAYERS = [
  { name: "Users & Access", items: ["Super Admin", "Admin", "Faculty", "Student", "Church Leader", "Guest"] },
  { name: "Web Application", items: ["Next.js 16 App Router", "Tailwind v4", "shadcn/ui"] },
  { name: "Application / API", items: ["Route Handlers", "Server Actions", "Zod validation"] },
  { name: "Data", items: ["PostgreSQL (Supabase)", "Drizzle ORM", "Supabase Storage"] },
  { name: "Integration", items: ["API mgmt", "Webhooks", "Workflow engine", "Queue + retries"] },
  { name: "External Services", items: ["GoHighLevel", "Google Workspace", "Microsoft 365", "Email/SMS", "Payments", "Video"] },
  { name: "Observability / Security", items: ["Sentry", "Audit logs", "RBAC + RLS", "Backups"] },
];
