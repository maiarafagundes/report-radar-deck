import { useState, useRef } from 'react';
import { Project, WeeklyReport, TeamMember, ProjectStatus } from '@/types/project';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (projects: Project[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const parseStatus = (value: string): ProjectStatus => {
  const map: Record<string, ProjectStatus> = {
    'no prazo': 'on-track',
    'on-track': 'on-track',
    'on track': 'on-track',
    'atrasado': 'delayed',
    'delayed': 'delayed',
    'em risco': 'at-risk',
    'at-risk': 'at-risk',
    'at risk': 'at-risk',
    'concluído': 'completed',
    'concluido': 'completed',
    'completed': 'completed',
  };
  return map[value?.toLowerCase()?.trim()] || 'on-track';
};

const parseSeniority = (value: string) => {
  const valid = ['Junior', 'Pleno', 'Senior', 'Lead', 'Staff', 'Principal'];
  const found = valid.find(v => v.toLowerCase() === value?.toLowerCase()?.trim());
  return (found || 'Pleno') as TeamMember['seniority'];
};

const parseCategory = (value: string): Project['category'] => {
  const valid = ['DevOps', 'SRE', 'Platform', 'Infrastructure'];
  const found = valid.find(v => v.toLowerCase() === value?.toLowerCase()?.trim());
  return (found || 'DevOps') as Project['category'];
};

const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const projects: Project[] = [];

        // Sheet "Projetos" — main project info
        const projSheet = workbook.Sheets[workbook.SheetNames[0]];
        const projRows: any[] = XLSX.utils.sheet_to_json(projSheet);

        if (projRows.length === 0) {
          setError('Planilha vazia. Verifique se há dados na primeira aba.');
          return;
        }

        // Sheet "Equipe" (optional)
        const teamSheet = workbook.SheetNames.length > 1 ? workbook.Sheets[workbook.SheetNames[1]] : null;
        const teamRows: any[] = teamSheet ? XLSX.utils.sheet_to_json(teamSheet) : [];

        // Sheet "Reports" (optional)
        const reportSheet = workbook.SheetNames.length > 2 ? workbook.Sheets[workbook.SheetNames[2]] : null;
        const reportRows: any[] = reportSheet ? XLSX.utils.sheet_to_json(reportSheet) : [];

        for (const row of projRows) {
          const projectId = String(row['id'] || row['ID'] || generateId());
          const projectName = String(row['nome'] || row['name'] || row['Nome'] || row['Name'] || 'Sem nome');

          // Team members for this project
          const team: TeamMember[] = teamRows
            .filter(t => String(t['projeto'] || t['project'] || t['Projeto'] || '') === projectName ||
                         String(t['projeto_id'] || t['project_id'] || '') === projectId)
            .map(t => ({
              id: generateId(),
              name: String(t['nome'] || t['name'] || t['Nome'] || ''),
              role: String(t['cargo'] || t['role'] || t['Cargo'] || ''),
              seniority: parseSeniority(String(t['senioridade'] || t['seniority'] || t['Senioridade'] || 'Pleno')),
            }));

          // Weekly reports for this project
          const reports: WeeklyReport[] = reportRows
            .filter(r => String(r['projeto'] || r['project'] || r['Projeto'] || '') === projectName ||
                         String(r['projeto_id'] || r['project_id'] || '') === projectId)
            .map(r => ({
              id: generateId(),
              weekStart: String(r['inicio_semana'] || r['week_start'] || r['Inicio Semana'] || ''),
              weekEnd: String(r['fim_semana'] || r['week_end'] || r['Fim Semana'] || ''),
              status: parseStatus(String(r['status'] || r['Status'] || '')),
              summary: String(r['resumo'] || r['summary'] || r['Resumo'] || ''),
              highlights: String(r['destaques'] || r['highlights'] || r['Destaques'] || '').split(';').map(s => s.trim()).filter(Boolean),
              blockers: String(r['blockers'] || r['Blockers'] || r['impedimentos'] || '').split(';').map(s => s.trim()).filter(Boolean),
              metrics: {
                tasksCompleted: Number(r['tasks_concluidas'] || r['tasks_completed'] || 0),
                tasksTotal: Number(r['tasks_total'] || 0),
                incidentsResolved: Number(r['incidentes'] || r['incidents_resolved'] || 0),
                deploymentsCount: Number(r['deploys'] || r['deployments'] || 0),
                uptimePercent: Number(r['uptime'] || 99.9),
              },
            }));

          const tags = String(row['tags'] || row['Tags'] || '').split(';').map(s => s.trim()).filter(Boolean);

          projects.push({
            id: projectId,
            name: projectName,
            description: String(row['descricao'] || row['description'] || row['Descricao'] || ''),
            category: parseCategory(String(row['categoria'] || row['category'] || row['Categoria'] || 'DevOps')),
            status: parseStatus(String(row['status'] || row['Status'] || '')),
            startDate: String(row['inicio'] || row['start_date'] || row['Inicio'] || ''),
            endDate: String(row['fim'] || row['end_date'] || row['Fim'] || ''),
            progress: Number(row['progresso'] || row['progress'] || row['Progresso'] || 0),
            tags: tags.length > 0 ? tags : ['Geral'],
            team: team.length > 0 ? team : [],
            weeklyReports: reports,
          });
        }

        if (projects.length === 0) {
          setError('Nenhum projeto encontrado na planilha.');
          return;
        }

        onUpload(projects);
        toast({ title: 'Upload realizado!', description: `${projects.length} projeto(s) importado(s) com sucesso.` });
        onClose();
      } catch (err) {
        console.error(err);
        setError('Erro ao ler a planilha. Verifique se o formato está correto.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Upload de Dados</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Arraste uma planilha Excel ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-4 rounded-lg bg-secondary/50 p-3 space-y-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            Formato esperado (3 abas)
          </p>

          <div>
            <p className="text-xs font-semibold text-primary mb-1">Aba 1 — Projetos</p>
            <div className="overflow-x-auto">
              <table className="text-[10px] text-muted-foreground font-mono w-full">
                <thead><tr className="text-foreground">
                  <th className="pr-2 text-left">nome</th><th className="pr-2 text-left">categoria</th><th className="pr-2 text-left">status</th><th className="pr-2 text-left">inicio</th><th className="pr-2 text-left">fim</th><th className="pr-2 text-left">progresso</th><th className="text-left">tags</th>
                </tr></thead>
                <tbody><tr>
                  <td className="pr-2">Projeto X</td><td className="pr-2">DevOps</td><td className="pr-2">No Prazo</td><td className="pr-2">2026-01-01</td><td className="pr-2">2026-06-30</td><td className="pr-2">50</td><td>CI/CD;K8s</td>
                </tr></tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-primary mb-1">Aba 2 — Equipe</p>
            <div className="overflow-x-auto">
              <table className="text-[10px] text-muted-foreground font-mono w-full">
                <thead><tr className="text-foreground">
                  <th className="pr-2 text-left">projeto</th><th className="pr-2 text-left">nome</th><th className="pr-2 text-left">cargo</th><th className="text-left">senioridade</th>
                </tr></thead>
                <tbody><tr>
                  <td className="pr-2">Projeto X</td><td className="pr-2">Ana Silva</td><td className="pr-2">SRE Engineer</td><td>Senior</td>
                </tr></tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-primary mb-1">Aba 3 — Reports</p>
            <div className="overflow-x-auto">
              <table className="text-[10px] text-muted-foreground font-mono w-full">
                <thead><tr className="text-foreground">
                  <th className="pr-2 text-left">projeto</th><th className="pr-2 text-left">inicio_semana</th><th className="pr-2 text-left">fim_semana</th><th className="pr-2 text-left">status</th><th className="pr-2 text-left">resumo</th><th className="text-left">destaques</th>
                </tr></thead>
                <tbody><tr>
                  <td className="pr-2">Projeto X</td><td className="pr-2">2026-02-14</td><td className="pr-2">2026-02-20</td><td className="pr-2">No Prazo</td><td className="pr-2">Sprint ok...</td><td>Item 1;Item 2</td>
                </tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
