import { Professional, Project } from '@/types/project';
import { getSeniorityColor } from '@/lib/projectUtils';
import { Users, Search, Award, Briefcase } from 'lucide-react';
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
      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar profissional..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(prof => {
          const initials = prof.name.split(' ').map(n => n[0]).join('').slice(0, 2);
          return (
            <button
              key={prof.id}
              onClick={() => onProfessionalClick(prof.name)}
              className="glass-card p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{prof.name}</p>
                  <p className="text-xs text-muted-foreground">{prof.role}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${getSeniorityColor(prof.seniority)}`}>
                  {prof.seniority}
                </span>
              </div>

              {/* Skills preview */}
              {prof.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prof.skills.slice(0, 4).map(s => (
                    <span key={s.name} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                      {s.name}
                    </span>
                  ))}
                  {prof.skills.length > 4 && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{prof.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {prof.certifications.length} cert.
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {prof.projectCount} projeto(s)
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum profissional encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default TeamTab;
