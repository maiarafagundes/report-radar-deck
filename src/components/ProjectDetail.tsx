import { useState } from 'react';
import { Project, WeeklyReport } from '@/types/project';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import TeamList from './TeamList';

import { formatDate, getDaysRemaining, getProjectTimelinePercent, getStatusLabel } from '@/lib/projectUtils';
import { ArrowLeft, Calendar, Clock, Download, Tag, AlertTriangle, CheckCircle, Plus, Activity, ListTodo, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateProjectPDF, generateWeeklyReportPDF } from '@/lib/pdfExport';
import NewWeeklyReportModal from './NewWeeklyReportModal';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onMemberClick?: (name: string) => void;
  onAddReport?: (projectId: string, report: WeeklyReport) => void;
}

const ProjectDetail = ({ project, onBack, onMemberClick, onAddReport }: ProjectDetailProps) => {
  const timelinePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);
  const latestReport = project.weeklyReports[0];
  const [reportOpen, setReportOpen] = useState(false);

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

      {/* Team */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Equipe Ativa ({project.team.length})</h2>
        <div className="glass-card p-4">
          <TeamList team={project.team} onMemberClick={onMemberClick} />
        </div>
      </div>

      {/* Weekly Reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Histórico de Reports</h2>
          <Button size="sm" className="gap-2" onClick={() => setReportOpen(true)}>
            <Plus className="h-4 w-4" />
            Cadastrar Status Semanal
          </Button>
        </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => generateWeeklyReportPDF(project, report)}
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">1. Resumo da semana</p>
                <p className="text-sm text-foreground">{report.summary}</p>
              </div>
              
              {report.highlights.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> 2. Entregas / Destaques
                  </p>
                  <ul className="space-y-0.5">
                    {report.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.inProgress && report.inProgress.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> 3. Em andamento
                  </p>
                  <ul className="space-y-0.5">
                    {report.inProgress.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.blockers.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-danger mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> 4. Riscos / Bloqueios
                  </p>
                  <ul className="space-y-0.5">
                    {report.blockers.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.nextSteps && report.nextSteps.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-warning mb-1 flex items-center gap-1">
                    <ListTodo className="h-3 w-3" /> 5. Próximos passos
                  </p>
                  <ul className="space-y-0.5">
                    {report.nextSteps.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.indicators && report.indicators.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> 6. Indicadores
                  </p>
                  <ul className="space-y-0.5">
                    {report.indicators.map((h, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <NewWeeklyReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onCreate={(report) => onAddReport?.(project.id, report)}
      />
    </div>
  );
};

export default ProjectDetail;
