import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Professional, TeamMember } from '@/types/project';
import { Search, UserPlus, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  currentTeam: TeamMember[];
  professionals: Professional[];
  onSave: (team: TeamMember[]) => Promise<void> | void;
}

export default function ManageTeamModal({ isOpen, onClose, projectName, currentTeam, professionals, onSave }: Props) {
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
      setSelected(prev => [...prev, { id: p.id, name: p.name, role: p.role, seniority: p.seniority }]);
    }
  };

  const removeMember = (id: string) => setSelected(prev => prev.filter(s => s.id !== id));

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
              <div className="flex flex-wrap gap-2">
                {selected.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-xs">
                    {m.name} · <span className="opacity-70">{m.role || m.seniority}</span>
                    <button onClick={() => removeMember(m.id)} className="hover:bg-primary/20 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
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