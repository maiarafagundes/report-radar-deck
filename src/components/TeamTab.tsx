import { Professional, Project } from '@/types/project';
import { getSeniorityColor } from '@/lib/projectUtils';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';

interface TeamTabProps {
  professionals: Professional[];
  projects: Project[];
  onProfessionalClick: (name: string) => void;
}

const TeamTab = ({ professionals, projects, onProfessionalClick }: TeamTabProps) => {
  const [search, setSearch] = useState('');

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Equipe ({professionals.length} profissionais)</h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar profissional..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-sm h-8"
            />
          </div>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map(prof => {
            const initials = prof.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            return (
              <button
                key={prof.id}
                onClick={() => onProfessionalClick(prof.name)}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 text-left hover:bg-secondary transition-colors"
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
    </div>
  );
};

export default TeamTab;
