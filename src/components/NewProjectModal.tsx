import { useState } from 'react';
import { Project, ProjectStatus, ProjectType } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProjectTimelinePercent } from '@/lib/projectUtils';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}

const categories: Project['category'][] = ['DevOps', 'SRE', 'Platform', 'Infrastructure'];
const types: { value: ProjectType; label: string }[] = [
  { value: 'projeto', label: 'Projeto' },
  { value: 'operacao', label: 'Operação' },
  { value: 'sustentacao', label: 'Sustentação' },
  { value: 'dedicado', label: 'Dedicado (Body Shop)' },
];
const statuses: { value: ProjectStatus; label: string }[] = [
  { value: 'on-track', label: 'No Prazo' },
  { value: 'delayed', label: 'Atrasado' },
  { value: 'at-risk', label: 'Em Risco' },
  { value: 'completed', label: 'Concluído' },
];

const NewProjectModal = ({ isOpen, onClose, onCreate }: NewProjectModalProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Project['category']>('Infrastructure');
  const [type, setType] = useState<ProjectType>('projeto');
  const [status, setStatus] = useState<ProjectStatus>('on-track');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tags, setTags] = useState('');

  const computedProgress = startDate && endDate ? getProjectTimelinePercent(startDate, endDate) : 0;

  const reset = () => {
    setName(''); setCategory('Infrastructure'); setType('projeto');
    setStatus('on-track'); setDescription(''); setStartDate('');
    setEndDate(''); setTags('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;
    const project: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      category,
      type,
      status,
      startDate,
      endDate,
      progress: getProjectTimelinePercent(startDate, endDate),
      team: [],
      weeklyReports: [],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    onCreate(project);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Kubernetes Migration" required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Project['category'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo de Atendimento</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descreva o escopo do projeto..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progresso (auto)</Label>
              <Input value={`${computedProgress}%`} disabled className="bg-secondary" />
            </div>
            <div>
              <Label>Data de Início *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <Label>Data de Fim *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Kubernetes, Cloud, Helm, Istio" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectModal;