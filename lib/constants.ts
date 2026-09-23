export const APP_NAME = "Church Leadership LMS";
export const APP_SUBTITLE = "Engineering Command Center";

export const NAV_ITEMS = [
  { href: "/app/overview", label: "Overview", icon: "LayoutDashboard" },
  { href: "/app/architecture", label: "Architecture", icon: "Boxes" },
  { href: "/app/roadmap", label: "Roadmap", icon: "Map" },
  { href: "/app/frontend", label: "Frontend", icon: "Monitor" },
  { href: "/app/backend", label: "Backend", icon: "Server" },
  { href: "/app/data", label: "Data", icon: "Database" },
  { href: "/app/integrations", label: "Integrations", icon: "Plug" },
  { href: "/app/security", label: "Security", icon: "ShieldCheck" },
  { href: "/app/devops", label: "DevOps", icon: "Rocket" },
  { href: "/app/testing", label: "Testing", icon: "FlaskConical" },
  { href: "/app/documentation", label: "Documentation", icon: "BookOpen" },
  { href: "/app/team", label: "Team", icon: "Users" },
  { href: "/app/activity", label: "Activity", icon: "Activity" },
  { href: "/app/settings", label: "Settings", icon: "Settings" },
] as const;

export const ENVIRONMENTS = [
  "local",
  "development",
  "preview",
  "staging",
  "production",
] as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[number];
