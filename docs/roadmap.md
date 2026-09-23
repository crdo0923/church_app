# Roadmap — the 10 build phases (seeded, tracked in-app)

Progress is derived (`done_tasks/total_tasks` per phase; project = weighted average).
Manual % entry is forbidden unless `manual_progress_override` + reason (audited).

| # | Phase | Focus (spec §31 task families) | Depends on |
|---|---|---|---|
| 01 | Foundation & Product Setup | repo, Next.js 16, TS, Tailwind v4, shadcn, design tokens, env config, Supabase project, DB foundation, auth, GitHub CI | — |
| 02 | Core LMS & Identity | auth flows, profiles, RBAC, dashboard shell, settings, audit logs | 01 |
| 03 | Church & Faculty | church directory, regions, faculty profiles/roles/availability/assignments | 02 |
| 04 | Student Management | applicants, enrollment, profiles, attendance, progress, batches | 02 |
| 05 | Learning & Assessments | courses, lessons, materials, quizzes, assessments, grades, certificates | 04 |
| 06 | Scheduling & Communications | calendar, schedules, events, email/SMS, reminders | 03, 05 |
| 07 | Integrations & Automation | API mgmt, webhooks, GHL/Google/Microsoft, workflow engine, queue, retries, mapping | 06 |
| 08 | Reporting & Analytics | dashboards, completion/enrollment/church/leadership/audit reports | 05, 07 |
| 09 | Security & Compliance | MFA, headers, RBAC audit, data protection, backups, monitoring, alerts, dep security | 01–08 |
| 10 | Production & Operations | staging/prod, monitoring, backups, deploy workflow, rollback, docs, DR, readiness review | 09 |

Phase detail shows: number, name, status (`PLANNED|READY|IN PROGRESS|BLOCKED|AT RISK|COMPLETED`),
progress (derived), owner, start/target dates, dependencies, milestones, tasks, risks, blockers.
Milestones carry success criteria + owner + target/completion dates. Tasks carry the full
spec-§7 field set incl. GitHub refs and doc links.
