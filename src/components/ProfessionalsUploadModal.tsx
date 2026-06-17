import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { Professional, TeamMember } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (pros: Professional[]) => Promise<void> | void;
}

const parseSeniority = (value: string): TeamMember['seniority'] => {
  const valid: TeamMember['seniority'][] = ['Junior', 'Pleno', 'Senior', 'Lead', 'Staff', 'Principal'];
  return valid.find(v => v.toLowerCase() === value?.toLowerCase()?.trim()) ?? 'Pleno';
};

export default function ProfessionalsUploadModal({ isOpen, onClose, onUpload }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const pros: Professional[] = rows.map(r => ({
          id: crypto.randomUUID(),
          name: String(r['nome'] || r['name'] || r['Nome'] || '').trim(),
          role: String(r['cargo'] || r['role'] || r['Cargo'] || '').trim(),
          seniority: parseSeniority(String(r['senioridade'] || r['seniority'] || r['Senioridade'] || 'Pleno')),
          resumo: String(r['resumo'] || r['perfil'] || r['Resumo'] || '').trim(),
          softSkills: String(r['soft_skills'] || r['softskills'] || r['Soft Skills'] || '').split(';').map(s => s.trim()).filter(Boolean),
          certifications: String(r['certificacoes'] || r['certifications'] || r['Certificações'] || '').split(';').map(s => s.trim()).filter(Boolean),
          skills: [],
          projectHistory: [],
        })).filter(p => p.name);

        if (pros.length === 0) {
          setError('Nenhum profissional encontrado. Verifique se há coluna "nome" preenchida.');
          return;
        }

        await onUpload(pros);
        toast({ title: 'Importação concluída', description: `${pros.length} profissional(is) cadastrado(s).` });
        onClose();
      } catch (err) {
        console.error(err);
        setError('Erro ao ler a planilha. Verifique o formato.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      {
        nome: 'Ana Silva',
        cargo: 'DevOps Engineer',
        senioridade: 'Senior',
        resumo: 'Profissional proativa com forte capacidade de comunicação e resolução de problemas.',
        soft_skills: 'Liderança;Comunicação;Mentoria;Resolução de Problemas',
        certificacoes: 'AWS Solutions Architect;CKA;GitHub Actions Certified',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 50 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Profissionais');
    XLSX.writeFile(wb, 'template-profissionais.xlsx');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>Importar Profissionais</span>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs mr-6" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" /> Baixar Template
            </Button>
          </DialogTitle>
        </DialogHeader>

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
          <p className="text-sm font-medium text-foreground mb-1">Arraste a planilha ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground">Formatos: .xlsx, .xls</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-2">
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" /> Colunas esperadas
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            nome · cargo · senioridade · resumo · soft_skills (;) · certificacoes (;)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}