import { Project, ProjectStatus } from '@/types/project';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (dateStr: string) => {
  return format(parseISO(dateStr), "dd MMM yyyy", { locale: ptBR });
};

export const formatDateShort = (dateStr: string) => {
  return format(parseISO(dateStr), "dd/MM/yy");
};

export const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    'on-track': 'No Prazo',
    'delayed': 'Atrasado',
    'at-risk': 'Em Risco',
    'completed': 'Concluído',
  };
  return labels[status];
};

export const getStatusClass = (status: ProjectStatus): string => {
  const classes: Record<ProjectStatus, string> = {
    'on-track': 'status-on-track',
    'delayed': 'status-delayed',
    'at-risk': 'status-at-risk',
    'completed': 'status-on-track',
  };
  return classes[status];
};

export const getDaysRemaining = (endDate: string): number => {
  return differenceInDays(parseISO(endDate), new Date());
};

export const getProjectTimelinePercent = (startDate: string, endDate: string): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const total = differenceInDays(end, start);
  const elapsed = differenceInDays(new Date(), start);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

export const isProjectOverdue = (project: Project): boolean => {
  const timePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  return timePercent > project.progress + 15;
};

export const getSeniorityColor = (seniority: string): string => {
  const colors: Record<string, string> = {
    'Junior': 'bg-primary/20 text-primary',
    'Pleno': 'bg-primary/30 text-primary',
    'Senior': 'bg-success/20 text-success',
    'Lead': 'bg-warning/20 text-warning',
    'Staff': 'bg-[hsl(280,65%,60%)]/20 text-[hsl(280,65%,60%)]',
    'Principal': 'bg-danger/20 text-danger',
  };
  return colors[seniority] || 'bg-muted text-muted-foreground';
};
