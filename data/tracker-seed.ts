/**
 * Bundled seed snapshot — the 10 tracker phases (§37) with full brief content.
 *
 * This is STATIC REFERENCE DATA (human-authored, checked into git) and also
 * the fallback the app renders when no writable SQLite file exists (e.g.
 * fresh serverless boot before seeding). It is NOT LMS production data —
 * there is no LMS connection anywhere in this tracker (§33, §52).
 *
 * Live, editable state (statuses, criteria checks, evidence, audit) lives in
 * SQLite once seeded. `seedSnapshot()` is idempotent: it only inserts rows
 * that do not already exist, never overwriting human updates.
 */

export interface SeedDeliverable {
  label: string;
  owner: string;
}

export interface SeedMilestone {
  id: string;
  title: string;
  description: string;
  objective: string;
  owner: string;
  targetDate: string;
}

export interface SeedTask {
  id: string;
  milestoneId: string;
  title: string;
  summary: string;
  description: string;
  owner: string;
}

export interface SeedPhase {
  number: string;
  name: string;
  summary: string;
  objective: string;
  scope: string[];
  outOfScope: string[];
  owner: string;
  target: string;
  dependencies: string;
  deliverables: SeedDeliverable[];
  milestones: SeedMilestone[];
  tasks: SeedTask[];
  acceptance: { label: string; category: string }[];
  risks: string[];
  blockers: string[];
  completionNotes: string;
}

export const PROJECT_SEED = {
  status: "ON_TRACK",
  currentPhaseNumber: "01",
  overallProgress: 42,
  progressSource: "MANUAL" as const,
  currentFocus: "Authentication foundation",
  blockerNote: "Waiting for Supabase project configuration.",
};

export const PHASE_SEED_ORDER = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];

function t(phase: string, kind: string, n: number): string {
  return `${phase}-${kind}-${String(n).padStart(2, "0")}`;
}

export const PHASES: SeedPhase[] = [
  {
    number: "01",
    name: "Foundation & Product Setup",
    summary: "Prepare the technical foundation before feature work begins.",
    objective:
      "Establish the technical foundation required for the project before feature development begins.",
    scope: [
      "repository structure",
      "application shell",
      "design system",
      "environment configuration",
      "database foundation",
      "authentication foundation",
      "CI",
      "test foundation",
      "documentation",
    ],
    outOfScope: [
      "student management",
      "course delivery",
      "external LMS integrations",
      "production LMS records",
    ],
    owner: "Engineering",
    target: "Oct 2026",
    dependencies: "None — this is the root phase.",
    deliverables: [
      { label: "Repository initialized", owner: "Engineering" },
      { label: "Application shell implemented", owner: "Engineering" },
      { label: "Design tokens established", owner: "Engineering" },
      { label: "Environment variables documented", owner: "Engineering" },
      { label: "Database schema documented", owner: "Engineering" },
      { label: "Authentication design documented", owner: "Engineering" },
      { label: "CI pipeline working", owner: "Engineering" },
      { label: "Unit test foundation working", owner: "Engineering" },
      { label: "E2E smoke test working", owner: "Engineering" },
      { label: "Deployment plan documented", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("01", "m", 1),
        title: "Repository & shell",
        description: "Repo, app shell, design tokens, and CI are in place.",
        objective: "A developer can clone, install, and run the tracker locally.",
        owner: "Engineering",
        targetDate: "Sep 2026",
      },
      {
        id: t("01", "m", 2),
        title: "Auth foundation",
        description: "Tracker accounts, roles, and protected routes work.",
        objective: "Only authorized team members can view or edit roadmap data.",
        owner: "Engineering",
        targetDate: "Oct 2026",
      },
      {
        id: t("01", "m", 3),
        title: "Data foundation",
        description: "Embedded store, seed content, and audit logging work.",
        objective: "Roadmap content persists with a full change history.",
        owner: "Engineering",
        targetDate: "Oct 2026",
      },
    ],
    tasks: [
      {
        id: t("01", "t", 1),
        milestoneId: t("01", "m", 1),
        title: "Initialize repository structure",
        summary: "Scaffold app, folders, and base documentation.",
        description: "Next.js app, docs, env example, and CI skeleton committed to church_app.",
        owner: "Engineering",
      },
      {
        id: t("01", "t", 2),
        milestoneId: t("01", "m", 1),
        title: "Build application shell",
        summary: "Sidebar, topbar, cards, and responsive layout.",
        description: "Shared AppShell with navigation, design tokens, and mobile drawer.",
        owner: "Engineering",
      },
      {
        id: t("01", "t", 3),
        milestoneId: t("01", "m", 2),
        title: "Create authentication foundation",
        summary: "Login, sessions, roles, and route protection.",
        description:
          "Email+password login, invite flow, session cookies, and server-side role checks.",
        owner: "Engineering",
      },
      {
        id: t("01", "t", 4),
        milestoneId: t("01", "m", 3),
        title: "Create embedded data foundation",
        summary: "SQLite store, seed script, and audit logging.",
        description: "Tracker database with 10 seeded phases and append-only audit log.",
        owner: "Engineering",
      },
      {
        id: t("01", "t", 5),
        milestoneId: t("01", "m", 1),
        title: "Document environments & deployment",
        summary: "Vercel deploy and custom domain verified.",
        description: "roadmapchurch.crdo.site live with DNS verified and docs updated.",
        owner: "Engineering",
      },
    ],
    acceptance: [
      { label: "All required foundation deliverables completed", category: "DOCUMENTATION" },
      { label: "Required acceptance criteria passed", category: "TESTING" },
      { label: "No unresolved blocker remains", category: "FUNCTIONAL" },
      { label: "Project owner approves phase completion", category: "DOCUMENTATION" },
    ],
    risks: ["Scope creep pulls feature work into the foundation phase."],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "02",
    name: "Core LMS & Identity",
    summary: "Define the planned LMS identity model and core application behavior.",
    objective:
      "Define and track the core identity and foundational application behavior of the planned LMS.",
    scope: ["user model", "role model", "permissions model", "dashboard foundation", "audit design"],
    outOfScope: ["course delivery", "enrollment workflows", "production LMS records"],
    owner: "Engineering",
    target: "Nov 2026",
    dependencies: "Phase 01 completion review approved.",
    deliverables: [
      { label: "User model documented", owner: "Engineering" },
      { label: "Role model documented", owner: "Engineering" },
      { label: "Permissions model documented", owner: "Engineering" },
      { label: "Dashboard foundation tracked", owner: "Engineering" },
      { label: "Audit design documented", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("02", "m", 1),
        title: "Identity model agreed",
        description: "User, role, and permission model reviewed and accepted.",
        objective: "Everyone builds against the same identity assumptions.",
        owner: "Engineering",
        targetDate: "Nov 2026",
      },
    ],
    tasks: [
      {
        id: t("02", "t", 1),
        milestoneId: t("02", "m", 1),
        title: "Document intended LMS user model",
        summary: "Tracker-facing documentation of the planned LMS identity model.",
        description: "User types, lifecycle, and how they differ from tracker accounts.",
        owner: "Engineering",
      },
      {
        id: t("02", "t", 2),
        milestoneId: t("02", "m", 1),
        title: "Document role & permission model",
        summary: "Roles, capabilities, and enforcement points.",
        description: "Planned LMS roles with server-side enforcement expectations.",
        owner: "Engineering",
      },
    ],
    acceptance: [
      { label: "Identity model reviewed and accepted", category: "DOCUMENTATION" },
      { label: "Completion evidence attached", category: "DOCUMENTATION" },
    ],
    risks: ["Confusing tracker accounts with LMS accounts."],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "03",
    name: "Church & Faculty",
    summary: "Define church and faculty workflows in the planned LMS.",
    objective: "Track the definition of church structure and faculty workflows.",
    scope: ["church structure", "regions/groups", "faculty profiles", "faculty roles", "faculty assignments"],
    outOfScope: ["student enrollment", "course delivery"],
    owner: "Product",
    target: "Nov 2026",
    dependencies: "Phase 02 identity model accepted.",
    deliverables: [
      { label: "Church structure defined", owner: "Product" },
      { label: "Regions/groups defined", owner: "Product" },
      { label: "Faculty profiles defined", owner: "Product" },
      { label: "Faculty roles defined", owner: "Product" },
      { label: "Faculty assignments tracked", owner: "Product" },
    ],
    milestones: [
      {
        id: t("03", "m", 1),
        title: "Church & faculty workflows agreed",
        description: "Structure and assignments reviewed with stakeholders.",
        objective: "Faculty planning has a single agreed reference.",
        owner: "Product",
        targetDate: "Nov 2026",
      },
    ],
    tasks: [
      {
        id: t("03", "t", 1),
        milestoneId: t("03", "m", 1),
        title: "Define church structure & regions",
        summary: "Churches, regions, and groupings.",
        description: "Document the planned organizational hierarchy.",
        owner: "Product",
      },
      {
        id: t("03", "t", 2),
        milestoneId: t("03", "m", 1),
        title: "Define faculty profiles & assignments",
        summary: "Faculty roles and assignment rules.",
        description: "Profiles, availability expectations, and assignment workflow.",
        owner: "Product",
      },
    ],
    acceptance: [{ label: "All acceptance criteria accepted by stakeholders", category: "DOCUMENTATION" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "04",
    name: "Student Management",
    summary: "Define applicant, enrollment, and student progress workflows.",
    objective: "Track the definition of student lifecycle workflows.",
    scope: ["application flow", "enrollment workflow", "student profile design", "attendance model", "progress model", "batch assignment"],
    outOfScope: ["course content", "certificates"],
    owner: "Engineering",
    target: "Dec 2026",
    dependencies: "Phase 02 identity model accepted.",
    deliverables: [
      { label: "Application flow defined", owner: "Engineering" },
      { label: "Enrollment workflow defined", owner: "Engineering" },
      { label: "Student profile design agreed", owner: "Engineering" },
      { label: "Attendance model defined", owner: "Engineering" },
      { label: "Progress model defined", owner: "Engineering" },
      { label: "Batch assignment rules defined", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("04", "m", 1),
        title: "Enrollment workflow agreed",
        description: "Application-to-enrollment path reviewed end to end.",
        objective: "No ambiguity in how a student enrolls.",
        owner: "Engineering",
        targetDate: "Dec 2026",
      },
    ],
    tasks: [
      {
        id: t("04", "t", 1),
        milestoneId: t("04", "m", 1),
        title: "Map application & enrollment workflow",
        summary: "End-to-end applicant journey.",
        description: "Inquiry, application, review, enrollment, and batch assignment steps.",
        owner: "Engineering",
      },
    ],
    acceptance: [{ label: "Enrollment workflow accepted with evidence", category: "FUNCTIONAL" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "05",
    name: "Learning & Assessments",
    summary: "Define courses, lessons, assessments, and certification.",
    objective: "Track the definition of learning content and assessment rules.",
    scope: ["courses", "lessons", "materials", "quizzes", "assessments", "grades", "certificates"],
    outOfScope: ["scheduling", "communications"],
    owner: "Engineering",
    target: "Jan 2027",
    dependencies: "Phase 04 student model defined.",
    deliverables: [
      { label: "Course structure defined", owner: "Engineering" },
      { label: "Lesson & materials model defined", owner: "Engineering" },
      { label: "Quiz & assessment rules defined", owner: "Engineering" },
      { label: "Grading rules defined", owner: "Engineering" },
      { label: "Certificate requirements defined", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("05", "m", 1),
        title: "Learning model agreed",
        description: "Content hierarchy and assessment rules accepted.",
        objective: "Course delivery planning has a stable reference.",
        owner: "Engineering",
        targetDate: "Jan 2027",
      },
    ],
    tasks: [
      {
        id: t("05", "t", 1),
        milestoneId: t("05", "m", 1),
        title: "Define course/lesson/assessment model",
        summary: "Content hierarchy and grading.",
        description: "Courses, lessons, materials, quizzes, grades, and certificate triggers.",
        owner: "Engineering",
      },
    ],
    acceptance: [{ label: "Learning model accepted with evidence", category: "FUNCTIONAL" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "06",
    name: "Scheduling & Communications",
    summary: "Define calendar, schedules, and communication workflows.",
    objective: "Track the definition of scheduling and notification workflows.",
    scope: ["calendar", "schedules", "events", "notifications", "communication workflows"],
    outOfScope: ["course content", "integrations"],
    owner: "Engineering",
    target: "Jan 2027",
    dependencies: "Phases 03 and 05 briefs available.",
    deliverables: [
      { label: "Calendar model defined", owner: "Engineering" },
      { label: "Schedule & event rules defined", owner: "Engineering" },
      { label: "Notification workflows defined", owner: "Engineering" },
      { label: "Communication templates listed", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("06", "m", 1),
        title: "Scheduling workflows agreed",
        description: "Calendar and notification expectations accepted.",
        objective: "Classes and reminders are planned consistently.",
        owner: "Engineering",
        targetDate: "Jan 2027",
      },
    ],
    tasks: [
      {
        id: t("06", "t", 1),
        milestoneId: t("06", "m", 1),
        title: "Define calendar & notification workflows",
        summary: "Schedules, events, and reminders.",
        description: "Calendar model plus email/SMS reminder expectations.",
        owner: "Engineering",
      },
    ],
    acceptance: [{ label: "Scheduling workflows accepted", category: "FUNCTIONAL" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "07",
    name: "Integrations & Automation",
    summary: "Specify external integrations and automation requirements.",
    objective: "Track integration specifications — no live sync in this tracker.",
    scope: ["integration specifications", "API requirements", "webhook specifications", "mapping rules", "workflow definitions", "retry/error requirements"],
    outOfScope: ["building live LMS integrations inside this tracker"],
    owner: "Integrations",
    target: "Feb 2027",
    dependencies: "Phase 06 workflows defined.",
    deliverables: [
      { label: "Integration specifications written", owner: "Integrations" },
      { label: "API requirements listed", owner: "Integrations" },
      { label: "Webhook specifications written", owner: "Integrations" },
      { label: "Mapping rules documented", owner: "Integrations" },
      { label: "Workflow definitions captured", owner: "Integrations" },
      { label: "Retry/error requirements captured", owner: "Integrations" },
    ],
    milestones: [
      {
        id: t("07", "m", 1),
        title: "Integration specs accepted",
        description: "Each external system has a written specification.",
        objective: "Integration work can be estimated from specs.",
        owner: "Integrations",
        targetDate: "Feb 2027",
      },
    ],
    tasks: [
      {
        id: t("07", "t", 1),
        milestoneId: t("07", "m", 1),
        title: "Write GoHighLevel integration spec",
        summary: "Contacts and enrollment workflow expectations.",
        description: "Spec only — credentials and sync are build-phase concerns, not tracker behavior.",
        owner: "Integrations",
      },
      {
        id: t("07", "t", 2),
        milestoneId: t("07", "m", 1),
        title: "Write Google/Microsoft/Email/SMS/Payments/Video specs",
        summary: "Remaining provider expectations.",
        description: "One spec section per provider with auth, endpoints, and webhook expectations.",
        owner: "Integrations",
      },
    ],
    acceptance: [{ label: "All provider specs reviewed", category: "DOCUMENTATION" }],
    risks: ["External API instability (tracked as risk, not auto-synced)."],
    blockers: ["GoHighLevel API credentials — owner: Integrations — impact: enrollment workflow spec sign-off."],
    completionNotes: "",
  },
  {
    number: "08",
    name: "Reporting & Analytics",
    summary: "Define reporting requirements and planned dashboards.",
    objective: "Track what the LMS must report — not live LMS metrics.",
    scope: ["reporting requirements", "dashboards", "completion reporting", "participation reporting", "leadership reporting"],
    outOfScope: ["live LMS telemetry"],
    owner: "Engineering",
    target: "Mar 2027",
    dependencies: "Phases 05 and 07 specs available.",
    deliverables: [
      { label: "Reporting requirements captured", owner: "Engineering" },
      { label: "Dashboard list agreed", owner: "Engineering" },
      { label: "Completion reporting defined", owner: "Engineering" },
      { label: "Participation reporting defined", owner: "Engineering" },
      { label: "Leadership reporting defined", owner: "Engineering" },
    ],
    milestones: [
      {
        id: t("08", "m", 1),
        title: "Reporting scope agreed",
        description: "Report list and owners accepted.",
        objective: "Reporting work is estimable.",
        owner: "Engineering",
        targetDate: "Mar 2027",
      },
    ],
    tasks: [
      {
        id: t("08", "t", 1),
        milestoneId: t("08", "m", 1),
        title: "Capture reporting requirements",
        summary: "Reports, audiences, and cadence.",
        description: "What each report answers, who owns it, and how often it is reviewed.",
        owner: "Engineering",
      },
    ],
    acceptance: [{ label: "Reporting scope accepted", category: "DOCUMENTATION" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "09",
    name: "Security & Compliance",
    summary: "Define authentication, authorization, and compliance requirements.",
    objective: "Track the security requirements of the planned LMS.",
    scope: ["authentication requirements", "authorization requirements", "RLS plan", "audit requirements", "encryption requirements", "backup requirements", "compliance checklist"],
    outOfScope: ["tracker production penetration testing"],
    owner: "Security",
    target: "Mar 2027",
    dependencies: "All prior phase briefs available for review.",
    deliverables: [
      { label: "Authentication requirements captured", owner: "Security" },
      { label: "Authorization requirements captured", owner: "Security" },
      { label: "RLS plan documented", owner: "Security" },
      { label: "Audit requirements captured", owner: "Security" },
      { label: "Encryption requirements captured", owner: "Security" },
      { label: "Backup requirements captured", owner: "Security" },
      { label: "Compliance checklist completed", owner: "Security" },
    ],
    milestones: [
      {
        id: t("09", "m", 1),
        title: "Security requirements accepted",
        description: "Checklist reviewed with stakeholders.",
        objective: "Security work is explicit and reviewable.",
        owner: "Security",
        targetDate: "Mar 2027",
      },
    ],
    tasks: [
      {
        id: t("09", "t", 1),
        milestoneId: t("09", "m", 1),
        title: "Complete security & compliance checklist",
        summary: "Auth, RLS, audit, encryption, backups.",
        description: "Each control has an owner and an acceptance state.",
        owner: "Security",
      },
    ],
    acceptance: [{ label: "Compliance checklist accepted", category: "SECURITY" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
  {
    number: "10",
    name: "Production & Operations",
    summary: "Define deployment, readiness, and operational plans.",
    objective: "Track production readiness of the planned LMS — not the tracker itself.",
    scope: ["deployment plan", "staging plan", "production readiness", "monitoring plan", "backup plan", "rollback plan", "disaster recovery plan", "documentation"],
    outOfScope: ["operating the LMS inside this tracker"],
    owner: "DevOps",
    target: "Apr 2027",
    dependencies: "Phase 09 security review approved.",
    deliverables: [
      { label: "Deployment plan written", owner: "DevOps" },
      { label: "Staging plan written", owner: "DevOps" },
      { label: "Production readiness checklist completed", owner: "DevOps" },
      { label: "Monitoring plan written", owner: "DevOps" },
      { label: "Backup plan written", owner: "DevOps" },
      { label: "Rollback plan written", owner: "DevOps" },
      { label: "Disaster recovery plan written", owner: "DevOps" },
      { label: "Operations documentation completed", owner: "DevOps" },
    ],
    milestones: [
      {
        id: t("10", "m", 1),
        title: "Production readiness review passed",
        description: "Checklist signed off by owner.",
        objective: "Go-live decision is evidence-based.",
        owner: "DevOps",
        targetDate: "Apr 2027",
      },
    ],
    tasks: [
      {
        id: t("10", "t", 1),
        milestoneId: t("10", "m", 1),
        title: "Complete production readiness review",
        summary: "Checklist, evidence, and sign-off.",
        description: "Deployment, monitoring, backup, rollback, and DR evidence reviewed.",
        owner: "DevOps",
      },
    ],
    acceptance: [{ label: "Readiness review signed off", category: "DEPLOYMENT" }],
    risks: [],
    blockers: [],
    completionNotes: "",
  },
];
