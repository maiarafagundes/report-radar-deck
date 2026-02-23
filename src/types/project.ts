export type ProjectStatus = 'on-track' | 'delayed' | 'at-risk' | 'completed';

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
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
  team: TeamMember[];
  weeklyReports: WeeklyReport[];
  tags: string[];
}

export interface DateFilter {
  startDate: string;
  endDate: string;
}
