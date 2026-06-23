import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WeeklyReport, ProjectStatus } from '@/types/project';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (report: WeeklyReport, projectId?: string) => void;
  projects?: { id: string; name: string }[];
}

const toBullets = (text: string) =>
  text.split('\n').map(s => s.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);

const NewWeeklyReportModal = ({ isOpen, onClose, onCreate, projects }: Props) => {
  const [projectId, setProjectId] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('on-track');
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState('');
  const [inProgress, setInProgress] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [indicators, setIndicators] = useState('');

  const reset = () => {
    setProjectId(''); setWeekStart(''); setWeekEnd(''); setStatus('on-track');
    setSummary(''); setHighlights(''); setInProgress('');
    setBlockers(''); setNextSteps(''); setIndicators('');
  };

  const handleSubmit = () => {
    if (!weekStart || !weekEnd || !summary.trim()) return;
    if (projects && !projectId) return;
    const report: WeeklyReport = {
      id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      weekStart,
      weekEnd,
      status,
      summary: summary.trim(),
      highlights: toBullets(highlights),
      blockers: toBullets(blockers),
      inProgress: toBullets(inProgress),
      nextSteps: toBullets(nextSteps),
      indicators: toBullets(indicators),
      metrics: {
        tasksCompleted: 0, tasksTotal: 0,
        incidentsResolved: 0, deploymentsCount: 0, uptimePercent: 100,
      },
    };
    onCreate(report, projectId || undefined);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Status Semanal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {projects && (
            <div>
              <Label>Projeto *</Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione um projeto...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início da Semana *</Label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
            <div>
              <Label>Fim da Semana *</Label>
              <Input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="on-track">No Prazo</option>
              <option value="at-risk">Em Risco</option>
              <option value="delayed">Atrasado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>

          <div>
            <Label>1. Resumo da semana *</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Ex.: Sprint 26.2.4 finalizando a quinzena 01/06 a 12/06..."
            />
          </div>

          <div>
            <Label>2. Entregas / Destaques (um tópico por linha)</Label>
            <Textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={5}
              placeholder={'DORA Metrics: extração via API Azure DevOps\nRefatoração de fluxo: análise concluída\nOn Premises: refatoração concluída em dupla'}
            />
          </div>

          <div>
            <Label>3. Em andamento (um tópico por linha)</Label>
            <Textarea
              value={inProgress}
              onChange={(e) => setInProgress(e.target.value)}
              rows={4}
              placeholder={'Extração de métricas DORA via API\nRefatoração de fluxo part 2 e part 3'}
            />
          </div>

          <div>
            <Label>4. Riscos / Bloqueios (um tópico por linha)</Label>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={4}
              placeholder={'DORA depende do cliente\nRefatoração: dependência entre part 2 e part 3'}
            />
          </div>

          <div>
            <Label>5. Próximos passos (um tópico por linha)</Label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              rows={4}
              placeholder={'Concluir extração de Pull Requests\nAlinhar com cliente fontes restantes'}
            />
          </div>

          <div>
            <Label>6. Indicadores (um tópico por linha)</Label>
            <Textarea
              value={indicators}
              onChange={(e) => setIndicators(e.target.value)}
              rows={4}
              placeholder={'Sprint 26.2.4: DORA, refatoração e On-Premises em evolução\nDORA: 2 de 4 métricas instrumentadas'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Cadastrar Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewWeeklyReportModal;