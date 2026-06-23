import { useEffect, useMemo, useState } from 'react';
import { Project, ProjectStatus, ProjectType, Professional, TeamMember, ClientContact } from '@/types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProjectTimelinePercent } from '@/lib/projectUtils';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
  /** When provided, modal switches to edit mode and calls onCreate with the same id. */
  initialProject?: Project | null;
  professionals?: Professional[];
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

const NewProjectModal = ({ isOpen, onClose, onCreate, initialProject, professionals = [] }: NewProjectModalProps) => {
  const isEdit = !!initialProject;
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Project['category']>('Infrastructure');
  const [type, setType] = useState<ProjectType>('projeto');
  const [status, setStatus] = useState<ProjectStatus>('on-track');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tags, setTags] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [proSearch, setProSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialProject) {
      setName(initialProject.name);
      setCategory(initialProject.category);
      setType(initialProject.type);
      setStatus(initialProject.status);
      setDescription(initialProject.description);
      setStartDate(initialProject.startDate);
      setEndDate(initialProject.endDate);
      setTags(initialProject.tags.join(', '));
      setTeam(initialProject.team ?? []);
      setContacts(initialProject.clientContacts ?? []);
    } else {
      setName(''); setCategory('Infrastructure'); setType('projeto');
      setStatus('on-track'); setDescription(''); setStartDate('');
      setEndDate(''); setTags('');
      setTeam([]); setContacts([]);
    }
    setProSearch('');
  }, [isOpen, initialProject]);

  const computedProgress = startDate && endDate ? getProjectTimelinePercent(startDate, endDate) : 0;

  const reset = () => {
    setName(''); setCategory('Infrastructure'); setType('projeto');
    setStatus('on-track'); setDescription(''); setStartDate('');
    setEndDate(''); setTags('');
    setTeam([]); setContacts([]);
  };

  const filteredPros = useMemo(() => {
    const q = proSearch.trim().toLowerCase();
    return professionals.filter(p => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [professionals, proSearch]);

  const toggleMember = (p: Professional) => {
    const exists = team.find(t => t.name.toLowerCase() === p.name.toLowerCase());
    if (exists) {
      setTeam(prev => prev.filter(t => t.id !== exists.id));
    } else {
      const memberId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `tm-${Date.now()}-${Math.random()}`;
      setTeam(prev => [...prev, { id: memberId, name: p.name, role: p.role, seniority: p.seniority, allocationPercent: 0, isBillable: true }]);
    }
  };

  const updateMember = (id: string, patch: Partial<TeamMember>) => {
    setTeam(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const addContact = () => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `cc-${Date.now()}-${Math.random()}`;
    setContacts(prev => [...prev, { id, name: '', email: '', phone: '' }]);
  };
  const updateContact = (id: string, patch: Partial<ClientContact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };
  const removeContact = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;
    // Validate contacts: name + email required
    for (const c of contacts) {
      if (!c.name.trim() || !c.email.trim()) {
        toast({ title: 'Contatos do cliente incompletos', description: 'Nome e e-mail são obrigatórios em todos os contatos.', variant: 'destructive' });
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email.trim())) {
        toast({ title: 'E-mail inválido', description: `Verifique o e-mail de ${c.name}.`, variant: 'destructive' });
        return;
      }
    }
    const project: Project = {
      id: initialProject?.id ?? crypto.randomUUID(),
      name,
      description,
      category,
      type,
      status,
      startDate,
      endDate,
      progress: getProjectTimelinePercent(startDate, endDate),
      team,
      weeklyReports: initialProject?.weeklyReports ?? [],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      clientContacts: contacts,
    };
    onCreate(project);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Projeto' : 'Cadastrar Projeto'}</DialogTitle>
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

            {/* Contatos do Cliente */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Equipe do Cliente</Label>
                <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7" onClick={addContact}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar contato
                </Button>
              </div>
              {contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum contato adicionado.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map(c => (
                    <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-4 h-8 text-sm" placeholder="Nome *" value={c.name} onChange={(e) => updateContact(c.id, { name: e.target.value })} />
                      <Input className="col-span-4 h-8 text-sm" placeholder="E-mail *" type="email" value={c.email} onChange={(e) => updateContact(c.id, { email: e.target.value })} />
                      <Input className="col-span-3 h-8 text-sm" placeholder="Telefone" value={c.phone ?? ''} onChange={(e) => updateContact(c.id, { phone: e.target.value })} />
                      <button type="button" onClick={() => removeContact(c.id)} className="col-span-1 text-muted-foreground hover:text-danger">
                        <Trash2 className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Equipe interna */}
            <div className="col-span-2 border-t border-border pt-4">
              <Label>Equipe Interna (opcional)</Label>
              <p className="text-[11px] text-muted-foreground mb-2">Marque os profissionais e defina a alocação (%) e se a hora será faturada.</p>
              {team.length > 0 && (
                <div className="space-y-2 mb-3">
                  {team.map(m => (
                    <div key={m.id} className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.role || m.seniority}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min={0} max={100}
                          value={m.allocationPercent ?? 0}
                          onChange={(e) => updateMember(m.id, { allocationPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                          className="h-7 w-16 text-xs px-2"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          checked={m.isBillable !== false}
                          onCheckedChange={(v) => updateMember(m.id, { isBillable: !!v })}
                          className="h-4 w-4"
                        />
                        <span className="text-[11px] text-muted-foreground">Billing</span>
                      </label>
                      <button type="button" onClick={() => setTeam(prev => prev.filter(t => t.id !== m.id))} className="text-muted-foreground hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {professionals.length > 0 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar profissional para adicionar..." value={proSearch} onChange={(e) => setProSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
                    {filteredPros.slice(0, 50).map(p => {
                      const checked = team.some(t => t.name.toLowerCase() === p.name.toLowerCase());
                      return (
                        <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-secondary/60 cursor-pointer text-sm">
                          <Checkbox checked={checked} onCheckedChange={() => toggleMember(p)} />
                          <span className="flex-1 truncate">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{p.role || '—'} · {p.seniority}</span>
                        </label>
                      );
                    })}
                    {filteredPros.length === 0 && (
                      <p className="p-3 text-xs text-muted-foreground text-center">Nenhum profissional encontrado.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEdit ? 'Salvar alterações' : 'Cadastrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectModal;