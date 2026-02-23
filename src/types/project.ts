export type ProjectStatus = 'on-track' | 'delayed' | 'at-risk' | 'completed';
export type ProjectType = 'operacao' | 'projeto';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  seniority: 'Junior' | 'Pleno' | 'Senior' | 'Lead' | 'Staff' | 'Principal';
  avatar?: string;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ProjectStatus;
  summary: string;
  highlights: string[];
  blockers: string[];
  metrics: {
    tasksCompleted: number;
    tasksTotal: number;
    incidentsResolved: number;
    deploymentsCount: number;
    uptimePercent: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: 'DevOps' | 'SRE' | 'Platform' | 'Infrastructure';
  type: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
  team: TeamMember[];
  weeklyReports: WeeklyReport[];
  tags: string[];
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  seniority: TeamMember['seniority'];
  resumo: string;
  softSkills: string[];
  certifications: string[];
  skills: { name: string; level: number }[];
  projectHistory: { projectName: string; role: string; period: string; current: boolean }[];
}

export interface DateFilter {
  startDate: string;
  endDate: string;
}
