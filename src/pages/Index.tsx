import { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '@/types/project';
import { mockProjects } from '@/data/mockProjects';
import ProjectCard from '@/components/ProjectCard';
import ProjectDetail from '@/components/ProjectDetail';
import UploadModal from '@/components/UploadModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, LayoutGrid, Filter, Activity } from 'lucide-react';

const statusFilters: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'No Prazo', value: 'on-track' },
  { label: 'Atrasado', value: 'delayed' },
  { label: 'Em Risco', value: 'at-risk' },
];

const Index = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !p.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFrom && p.startDate < dateFrom) return false;
      if (dateTo && p.endDate > dateTo) return false;
      return true;
    });
  }, [projects, statusFilter, searchQuery, dateFrom, dateTo]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const stats = useMemo(() => ({
    total: projects.length,
    onTrack: projects.filter(p => p.status === 'on-track').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
    atRisk: projects.filter(p => p.status === 'at-risk').length,
  }), [projects]);

  const handleUpload = (newProjects: Project[]) => {
    setProjects(prev => {
      const updated = [...prev];
      newProjects.forEach(np => {
        const idx = updated.findIndex(p => p.id === np.id);
        if (idx >= 0) updated[idx] = np;
        else updated.push(np);
      });
      return updated;
    });
  };

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <ProjectDetail project={selectedProject} onBack={() => setSelectedProjectId(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Status Report Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">DevOps & SRE — Relatório semanal de projetos</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.onTrack}</p>
            <p className="text-xs text-muted-foreground">No Prazo</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-danger">{stats.delayed}</p>
            <p className="text-xs text-muted-foreground">Atrasados</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.atRisk}</p>
            <p className="text-xs text-muted-foreground">Em Risco</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">De:</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 bg-secondary border-border text-sm" />
              <span className="text-xs text-muted-foreground">Até:</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 bg-secondary border-border text-sm" />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          <div className="mt-3 flex gap-2">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={setSelectedProjectId} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum projeto encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>
  );
};

export default Index;
