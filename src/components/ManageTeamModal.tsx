import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Professional, TeamMember, Project } from '@/types/project';
import { Search, UserPlus, X } from 'lucide-react';
import { Input as TextInput } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
  currentTeam: TeamMember[];
  professionals: Professional[];
  allProjects?: Project[];
  onSave: (team: TeamMember[]) => Promise<void> | void;
}

export default function ManageTeamModal({ isOpen, onClose, projectName, projectId, currentTeam, professionals, allProjects = [], onSave }: Props) {
  const [selected, setSelected] = useState<TeamMember[]>(currentTeam);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset on open
  const initialized = useMemo(() => ({ key: isOpen ? currentTeam.map(t => t.id).join(',') : '' }), [isOpen, currentTeam]);
  useMemo(() => { setSelected(currentTeam); setQuery(''); }, [initialized.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPros = useMemo(() => {
    const q = query.toLowerCase();
    return professionals.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
    );
  }, [professionals, query]);

  const isSelected = (proId: string, name: string) =>
    selected.some(s => s.id === proId || s.name.toLowerCase() === name.toLowerCase());

  const toggle = (p: Professional) => {
    if (isSelected(p.id, p.name)) {
      setSelected(prev => prev.filter(s => s.id !== p.id && s.name.toLowerCase() !== p.name.toLowerCase()));
    } else {
      // Calcula quanto a pessoa já tem em outros projetos para sugerir alocação inicial.
      const otherUsage = allProjects
        .filter(pr => pr.id !== projectId)
        .reduce((sum, pr) => sum + pr.team
          .filter(m => m.name.toLowerCase() === p.name.toLowerCase())
          .reduce((s, m) => s + (m.allocationPercent ?? 0), 0), 0);
      const initial = Math.max(0, Math.min(100, 100 - otherUsage));
      setSelected(prev => [...prev, { id: p.id, name: p.name, role: p.role, seniority: p.seniority, allocationPercent: initial }]);
    }
  };

  const removeMember = (id: string) => setSelected(prev => prev.filter(s => s.id !== id));

  const updateAllocation = (id: string, value: number) => {
    const next = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    const member = selected.find(s => s.id === id);
    if (member) {
      const otherUsage = allProjects
        .filter(pr => pr.id !== projectId)
        .reduce((sum, pr) => sum + pr.team
          .filter(m => m.name.toLowerCase() === member.name.toLowerCase())
          .reduce((s, m) => s + (m.allocationPercent ?? 0), 0), 0);
      if (otherUsage + next > 100) {
        toast({
          title: 'Limite de 100% excedido',
          description: `${member.name} já tem ${otherUsage}% em outros projetos. Máximo aqui: ${100 - otherUsage}%.`,
          variant: 'destructive',
        });
        return;
      }
    }
    setSelected(prev => prev.map(s => s.id === id ? { ...s, allocationPercent: next } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar equipe — {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Currently selected */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Profissionais atrelados ({selected.length})
            </p>
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum profissional atrelado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selected.map(m => (
                  <div key={m.id} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.role || m.seniority}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TextInput
                        type="number"
                        min={0}
                        max={200}
                        value={m.allocationPercent ?? 100}
                        onChange={(e) => updateAllocation(m.id, Number(e.target.value))}
                        className="w-20 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-danger p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search professionals */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profissionais cadastrados..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {filteredPros.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  <UserPlus className="h-5 w-5 mx-auto mb-1 opacity-60" />
                  Nenhum profissional encontrado.
                </div>
              )}
              {filteredPros.map(p => {
                const checked = isSelected(p.id, p.name);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-secondary/60 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggle(p)} />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.role || '—'} · {p.seniority}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar equipe'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}