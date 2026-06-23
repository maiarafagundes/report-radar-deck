import { useState } from 'react';
import { Project, WeeklyReport, TeamMember, Professional } from '@/types/project';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import TeamList from './TeamList';

import { formatDate, getDaysRemaining, getProjectTimelinePercent, getStatusLabel } from '@/lib/projectUtils';
import { ArrowLeft, Calendar, Clock, Download, Tag, Plus, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { generateProjectPDF, generateWeeklyReportPDF } from '@/lib/pdfExport';
import NewWeeklyReportModal from './NewWeeklyReportModal';
import ManageTeamModal from './ManageTeamModal';
import NewProjectModal from './NewProjectModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onMemberClick?: (name: string) => void;
  onAddReport?: (projectId: string, report: WeeklyReport) => void;
  professionals?: Professional[];
  onUpdateTeam?: (projectId: string, team: TeamMember[]) => Promise<void> | void;
  onUpdateProject?: (project: Project) => Promise<void> | void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
  onMarkCompleted?: (projectId: string) => Promise<void> | void;
}

const ProjectDetail = ({ project, onBack, onMemberClick, onAddReport, professionals = [], onUpdateTeam, onUpdateProject, onDeleteProject, onMarkCompleted }: ProjectDetailProps) => {
  const timelinePercent = getProjectTimelinePercent(project.startDate, project.endDate);
  const daysRemaining = getDaysRemaining(project.endDate);
  const latestReport = project.weeklyReports[0];
  const [reportOpen, setReportOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [openReports, setOpenReports] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </button>
        <div className="flex items-center gap-2">
          {onMarkCompleted && project.status !== 'completed' && (
            <Button onClick={() => onMarkCompleted(project.id)} variant="outline" size="sm" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Marcar como Concluído
            </Button>
          )}
          {onUpdateProject && (
            <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {onDeleteProject && (
            <Button onClick={() => setDeleteOpen(true)} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          )}
          <Button onClick={() => generateProjectPDF(project)} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
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
          <ProgressBar progress={project.progress} timelinePercent={timelinePercent} status={project.status} />
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Equipe Ativa ({project.team.length})</h2>
          {onUpdateTeam && (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setTeamOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Gerenciar Equipe
            </Button>
          )}
        </div>
        <div className="glass-card p-4">
          {project.team.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-2">
              Nenhum profissional atrelado. Clique em "Gerenciar Equipe" para adicionar.
            </p>
          ) : (
            <TeamList team={project.team} onMemberClick={onMemberClick} />
          )}
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
            <Collapsible
              key={report.id}
              open={!!openReports[report.id]}
              onOpenChange={(v) => setOpenReports((s) => ({ ...s, [report.id]: v }))}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${openReports[report.id] ? 'rotate-180' : ''}`}
                  />
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
                  </span>
                  <StatusBadge status={report.status} size="sm" />
                </CollapsibleTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => { e.stopPropagation(); generateWeeklyReportPDF(project, report); }}
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">1. Resumo da semana</p>
                <p className="text-sm text-foreground">{report.summary}</p>
              </div>
              <CollapsibleContent className="space-y-4 pt-2 border-t border-border mt-2">
                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  <div className="rounded-md bg-secondary/50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deploys</p>
                    <p className="text-sm font-bold text-foreground">{report.metrics.deploymentsCount}</p>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</p>
                    <p className="text-sm font-bold text-foreground">{report.metrics.tasksCompleted}/{report.metrics.tasksTotal}</p>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Incidentes</p>
                    <p className="text-sm font-bold text-foreground">{report.metrics.incidentsResolved}</p>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</p>
                    <p className="text-sm font-bold text-foreground">{report.metrics.uptimePercent}%</p>
                  </div>
                </div>

                {report.highlights.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-success">2. Entregas / Destaques</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {report.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {report.inProgress && report.inProgress.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-primary">3. Em andamento</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {report.inProgress.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {report.blockers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-destructive">4. Riscos / Bloqueios</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {report.blockers.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {report.nextSteps && report.nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-warning">5. Próximos passos</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {report.nextSteps.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {report.indicators && report.indicators.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-muted-foreground">6. Indicadores</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {report.indicators.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      <NewWeeklyReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onCreate={(report) => onAddReport?.(project.id, report)}
      />
      {onUpdateTeam && (
        <ManageTeamModal
          isOpen={teamOpen}
          onClose={() => setTeamOpen(false)}
          projectName={project.name}
          currentTeam={project.team}
          professionals={professionals}
          onSave={(team) => onUpdateTeam(project.id, team)}
        />
      )}
      {onUpdateProject && (
        <NewProjectModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          initialProject={project}
          onCreate={(updated) => { onUpdateProject(updated); }}
        />
      )}
      {onDeleteProject && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá permanentemente o projeto "{project.name}", junto com seus reports semanais e equipe associada. Não é possível desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => { await onDeleteProject(project.id); setDeleteOpen(false); onBack(); }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ProjectDetail;
