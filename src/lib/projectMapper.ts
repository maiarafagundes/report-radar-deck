import { Project, WeeklyReport, TeamMember, Professional, ClientContact } from '@/types/project';

type DbProject = any;
type DbTeam = any;
type DbReport = any;
type DbPro = any;

export function mapReportFromDb(r: DbReport): WeeklyReport {
  return {
    id: r.id,
    weekStart: r.week_start,
    weekEnd: r.week_end,
    status: r.status,
    summary: r.summary ?? '',
    highlights: r.highlights ?? [],
    blockers: r.blockers ?? [],
    inProgress: r.in_progress ?? [],
    nextSteps: r.next_steps ?? [],
    indicators: r.indicators ?? [],
    metrics: {
      tasksCompleted: r.tasks_completed ?? 0,
      tasksTotal: r.tasks_total ?? 0,
      incidentsResolved: r.incidents_resolved ?? 0,
      deploymentsCount: r.deployments_count ?? 0,
      uptimePercent: Number(r.uptime_percent ?? 100),
    },
  };
}

export function mapReportToDb(projectId: string, r: WeeklyReport) {
  return {
    id: r.id,
    project_id: projectId,
    week_start: r.weekStart,
    week_end: r.weekEnd,
    status: r.status,
    summary: r.summary,
    highlights: r.highlights ?? [],
    blockers: r.blockers ?? [],
    in_progress: r.inProgress ?? [],
    next_steps: r.nextSteps ?? [],
    indicators: r.indicators ?? [],
    tasks_completed: r.metrics.tasksCompleted,
    tasks_total: r.metrics.tasksTotal,
    incidents_resolved: r.metrics.incidentsResolved,
    deployments_count: r.metrics.deploymentsCount,
    uptime_percent: r.metrics.uptimePercent,
  };
}

export function mapTeamFromDb(t: DbTeam): TeamMember {
  return {
    id: t.id,
    name: t.name,
    role: t.role,
    seniority: t.seniority,
    avatar: t.avatar ?? undefined,
    allocationPercent: typeof t.allocation_percent === 'number' ? t.allocation_percent : 100,
    isBillable: t.is_billable !== false,
  };
}

export function mapTeamToDb(projectId: string, m: TeamMember) {
  return {
    id: m.id,
    project_id: projectId,
    name: m.name,
    role: m.role,
    seniority: m.seniority,
    avatar: m.avatar ?? null,
    allocation_percent: m.allocationPercent ?? 100,
    is_billable: m.isBillable !== false,
  };
}

export function mapContactFromDb(c: any): ClientContact {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? undefined,
    role: c.role ?? undefined,
  };
}

export function mapContactToDb(projectId: string, c: ClientContact) {
  return {
    id: c.id,
    project_id: projectId,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    role: c.role ?? null,
  };
}

export function mapProjectFromDb(p: DbProject, team: DbTeam[] = [], reports: DbReport[] = [], contacts: any[] = []): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    category: p.category,
    type: p.type,
    status: p.status,
    startDate: p.start_date,
    endDate: p.end_date,
    progress: p.progress ?? 0,
    tags: p.tags ?? [],
    team: team.map(mapTeamFromDb),
    weeklyReports: reports
      .sort((a, b) => (b.week_start || '').localeCompare(a.week_start || ''))
      .map(mapReportFromDb),
    clientContacts: contacts.map(mapContactFromDb),
  };
}

export function mapProjectToDb(p: Project) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    type: p.type,
    status: p.status,
    start_date: p.startDate,
    end_date: p.endDate,
    progress: p.progress,
    tags: p.tags ?? [],
  };
}

export function mapProfessionalFromDb(p: DbPro): Professional {
  return {
    id: p.id,
    name: p.name,
    role: p.role ?? '',
    seniority: p.seniority,
    resumo: p.resumo ?? '',
    softSkills: p.soft_skills ?? [],
    certifications: p.certifications ?? [],
    skills: Array.isArray(p.skills) ? p.skills : [],
    projectHistory: Array.isArray(p.project_history) ? p.project_history : [],
  };
}

export function mapProfessionalToDb(p: Professional) {
  return {
    name: p.name,
    role: p.role,
    seniority: p.seniority,
    resumo: p.resumo,
    soft_skills: p.softSkills ?? [],
    certifications: p.certifications ?? [],
    skills: p.skills ?? [],
    project_history: p.projectHistory ?? [],
  };
}