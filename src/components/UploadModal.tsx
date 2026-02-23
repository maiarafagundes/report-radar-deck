import { useState, useRef } from 'react';
import { Project, WeeklyReport, TeamMember } from '@/types/project';
import { Upload, X, FileJson, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (projects: Project[]) => void;
}

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
        const data = JSON.parse(e.target?.result as string);
        const projects: Project[] = Array.isArray(data) ? data : [data];
        onUpload(projects);
        toast({ title: 'Upload realizado!', description: `${projects.length} projeto(s) importado(s) com sucesso.` });
        onClose();
      } catch {
        setError('Arquivo JSON inválido. Verifique o formato.');
      }
    };
    reader.readAsText(file);
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
          <p className="text-sm font-medium text-foreground mb-1">Arraste um arquivo JSON ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">Formato: Array de projetos no padrão do sistema</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
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

        <div className="mt-4 rounded-lg bg-secondary/50 p-3">
          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
            <FileJson className="h-3.5 w-3.5 text-primary" />
            Exemplo de formato
          </p>
          <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
{`[{
  "id": "1",
  "name": "Projeto X",
  "description": "...",
  "category": "DevOps",
  "status": "on-track",
  "startDate": "2026-01-01",
  "endDate": "2026-06-30",
  "progress": 50,
  "tags": ["CI/CD"],
  "team": [{ "id": "t1", "name": "...", 
    "role": "...", "seniority": "Senior" }],
  "weeklyReports": [...]
}]`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
