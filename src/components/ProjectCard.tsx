import { Project } from '@/types/project';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import TeamList from './TeamList';
import { formatDate, getDaysRemaining, getProjectTimelinePercent } from '@/lib/projectUtils';
import { Calendar, Clock, Tag, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateProjectPDF } from '@/lib/pdfExport';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const timelinePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);
  const latestReport = project.weeklyReports?.[0];
  const reportsCount = project.weeklyReports?.length || 0;

  return (
    <div
      onClick={() => onClick(project.id)}
      className="glass-card p-5 cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-slide-in"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">
              {project.category}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground truncate">{project.name}</h3>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

      <ProgressBar progress={project.progress} timelinePercent={timelinePercent} />

      {/* Histórico Resumido */}
      <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Histórico Resumido
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {reportsCount} {reportsCount === 1 ? 'report' : 'reports'}
          </span>
        </div>
        {latestReport ? (
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono text-muted-foreground">
              {formatDate(latestReport.weekStart)} — {formatDate(latestReport.weekEnd)}
            </p>
            <p className="text-xs text-foreground line-clamp-2">{latestReport.summary}</p>
            <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-muted-foreground">
              <span>✓ {latestReport.metrics.tasksCompleted}/{latestReport.metrics.tasksTotal} tarefas</span>
              <span>🚀 {latestReport.metrics.deploymentsCount} deploys</span>
              <span>⚠ {latestReport.metrics.incidentsResolved} incidentes</span>
              <span>⏱ {latestReport.metrics.uptimePercent}% uptime</span>
            </div>
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">Nenhum status semanal cadastrado.</p>
        )}
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full gap-2 h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); generateProjectPDF(project); }}
        >
          <Download className="h-3 w-3" />
          Exportar PDF
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {daysRemaining > 0 ? `${daysRemaining}d restantes` : 'Encerrado'}
          </span>
        </div>
        <TeamList team={project.team} compact />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <Tag className="h-2.5 w-2.5" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProjectCard;
