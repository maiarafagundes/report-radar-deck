import { Project } from '@/types/project';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import TeamList from './TeamList';
import ProjectCharts from './ProjectCharts';
import { formatDate, getDaysRemaining, getProjectTimelinePercent, getStatusLabel } from '@/lib/projectUtils';
import { ArrowLeft, Calendar, Clock, Download, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateProjectPDF } from '@/lib/pdfExport';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetail = ({ project, onBack }: ProjectDetailProps) => {
  const timelinePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);
  const latestReport = project.weeklyReports[0];

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </button>
        <Button
          onClick={() => generateProjectPDF(project)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-mono font-medium text-primary uppercase tracking-wider">{project.category}</span>
            <h1 className="text-2xl font-bold text-foreground mt-1">{project.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-4">
          <ProgressBar progress={project.progress} timelinePercent={timelinePercent} />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Início: {formatDate(project.startDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Fim: {formatDate(project.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo encerrado'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              <Tag className="h-2.5 w-2.5" />{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Métricas & Gráficos</h2>
        <ProjectCharts reports={project.weeklyReports} />
      </div>

      {/* Team */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Equipe Ativa ({project.team.length})</h2>
        <div className="glass-card p-4">
          <TeamList team={project.team} />
        </div>
      </div>

      {/* Weekly Reports */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Histórico de Reports</h2>
        <div className="space-y-3">
          {project.weeklyReports.map(report => (
            <div key={report.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
                  </span>
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </div>
              <p className="text-sm text-foreground mb-3">{report.summary}</p>
              
              {report.highlights.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Destaques
                  </p>
                  <ul className="space-y-0.5">
                    {report.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.blockers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-danger mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Blockers
                  </p>
                  <ul className="space-y-0.5">
                    {report.blockers.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
