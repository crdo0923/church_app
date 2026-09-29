export const APP_NAME = "Church Leadership LMS";
export const APP_SUBTITLE = "Project Roadmap";

export const NAV_ITEMS = [
  { href: "/app/overview", label: "Overview", icon: "LayoutDashboard" },
  { href: "/app/roadmap", label: "Roadmap", icon: "Map" },
  { href: "/app/activity", label: "Activity", icon: "Activity" },
  { href: "/app/team", label: "Team", icon: "Users" },
  { href: "/app/documentation", label: "Documentation", icon: "BookOpen" },
  { href: "/app/architecture", label: "Planned Architecture", icon: "Boxes" },
  { href: "/app/frontend", label: "Technology", icon: "Monitor" },
  { href: "/app/integrations", label: "Integrations", icon: "Plug" },
  { href: "/app/security", label: "Security", icon: "ShieldCheck" },
  { href: "/app/devops", label: "Deployment", icon: "Rocket" },
  { href: "/app/testing", label: "Testing", icon: "FlaskConical" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Administration", icon: "ShieldCheck" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/audit", label: "Audit Log", icon: "Activity" },
  { href: "/admin/settings", label: "Tracker Settings", icon: "Settings" },
] as const;

export const ENVIRONMENTS = [
  "local",
  "development",
  "preview",
  "staging",
  "production",
] as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[number];
