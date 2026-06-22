import { Professional, Project } from '@/types/project';
import { Users, Search, UserPlus, Upload, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import ProfessionalFormModal from './ProfessionalFormModal';
import ProfessionalsUploadModal from './ProfessionalsUploadModal';

interface TeamTabProps {
  professionals: Professional[];
  projects: Project[];
  onProfessionalClick: (name: string) => void;
  onCreateProfessional?: (pro: Professional) => Promise<void> | void;
  onBulkUploadProfessionals?: (pros: Professional[]) => Promise<void> | void;
  onDeleteProfessional?: (id: string) => Promise<void> | void;
}

const TeamTab = ({ professionals, projects, onProfessionalClick, onCreateProfessional, onBulkUploadProfessionals, onDeleteProfessional }: TeamTabProps) => {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const enriched = useMemo(() => {
    return professionals.map(p => {
      const projectCount = projects.filter(proj =>
        proj.team.some(m => m.name.toLowerCase() === p.name.toLowerCase())
      ).length;
      return { ...p, projectCount };
    });
  }, [professionals, projects]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.seniority.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Header + Search */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Equipe ({professionals.length} profissionais)</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border text-sm h-8"
              />
            </div>
            {onBulkUploadProfessionals && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Importar
              </Button>
            )}
            {onCreateProfessional && (
              <Button size="sm" className="gap-1.5 h-8" onClick={() => setFormOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Novo Profissional
              </Button>
            )}
          </div>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map(prof => {
            const initials = prof.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            return (
              <div
                key={prof.id}
                className="group flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-colors"
              >
                <button
                  onClick={() => onProfessionalClick(prof.name)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{prof.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prof.role} · {prof.projectCount} projeto(s)
                    </p>
                  </div>
                </button>
                {onDeleteProfessional && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const msg = prof.projectCount > 0
                        ? `${prof.name} está atrelado a ${prof.projectCount} projeto(s). Remover assim mesmo?`
                        : `Remover ${prof.name}?`;
                      if (confirm(msg)) onDeleteProfessional(prof.id);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover profissional"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>
          </div>
        )}
      </div>

      {onCreateProfessional && (
        <ProfessionalFormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={onCreateProfessional}
        />
      )}
      {onBulkUploadProfessionals && (
        <ProfessionalsUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={onBulkUploadProfessionals}
        />
      )}
    </div>
  );
};

export default TeamTab;
