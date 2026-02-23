import { useMemo } from 'react';
import { Project, Professional } from '@/types/project';
import { getStatusLabel } from '@/lib/projectUtils';
import StatusBadge from './StatusBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, Tag, AlertTriangle, CheckCircle, AlertCircle, FolderKanban, Wrench, Briefcase } from 'lucide-react';

interface ExecutiveDashboardProps {
  projects: Project[];
  professionals: Professional[];
  onProfessionalClick: (name: string) => void;
  onProjectClick: (id: string) => void;
}

const ExecutiveDashboard = ({ projects, professionals, onProfessionalClick, onProjectClick }: ExecutiveDashboardProps) => {
  const stats = useMemo(() => {
    const clients = [...new Set(projects.map(p => p.name))];
    const tags = projects.reduce<Record<string, number>>((acc, p) => {
      p.tags.forEach(t => { acc[t] = (acc[t] || 0) + 1; });
      return acc;
    }, {});
    const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const byType = {
      operacao: projects.filter(p => p.type === 'operacao'),
      projeto: projects.filter(p => p.type === 'projeto'),
    };

    const stable = projects.filter(p => p.status === 'on-track' || p.status === 'completed');
    const atRisk = projects.filter(p => p.status === 'at-risk');
    const critical = projects.filter(p => p.status === 'delayed');

    const byCategory = projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    const situationData = [
      { name: 'Estável', value: stable.length, color: 'hsl(142, 71%, 45%)' },
      { name: 'Risco', value: atRisk.length, color: 'hsl(38, 92%, 50%)' },
      { name: 'Crítico', value: critical.length, color: 'hsl(0, 72%, 51%)' },
    ];

    const uniqueMembers = new Map<string, { name: string; role: string; seniority: string; projectCount: number }>();
    projects.forEach(p => {
      p.team.forEach(m => {
        if (uniqueMembers.has(m.name)) {
          uniqueMembers.get(m.name)!.projectCount++;
        } else {
          uniqueMembers.set(m.name, { name: m.name, role: m.role, seniority: m.seniority, projectCount: 1 });
        }
      });
    });

    return { clients, sortedTags, byType, stable, atRisk, critical, categoryData, situationData, uniqueMembers: Array.from(uniqueMembers.values()) };
  }, [projects]);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card p-4 text-center">
          <FolderKanban className="mx-auto h-5 w-5 text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{projects.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Briefcase className="mx-auto h-5 w-5 text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{stats.byType.projeto.length}</p>
          <p className="text-xs text-muted-foreground">Projetos</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Wrench className="mx-auto h-5 w-5 text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{stats.byType.operacao.length}</p>
          <p className="text-xs text-muted-foreground">Operações</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle className="mx-auto h-5 w-5 text-success mb-1" />
          <p className="text-2xl font-bold text-success">{stats.stable.length}</p>
          <p className="text-xs text-muted-foreground">Estáveis</p>
        </div>
        <div className="glass-card p-4 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-warning mb-1" />
          <p className="text-2xl font-bold text-warning">{stats.atRisk.length}</p>
          <p className="text-xs text-muted-foreground">Em Risco</p>
        </div>
        <div className="glass-card p-4 text-center">
          <AlertCircle className="mx-auto h-5 w-5 text-danger mb-1" />
          <p className="text-2xl font-bold text-danger">{stats.critical.length}</p>
          <p className="text-xs text-muted-foreground">Críticos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Situação Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Situação Geral</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.situationData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {stats.situationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Category */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Por Categoria</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(213, 94%, 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projects by situation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Críticos ({stats.critical.length})
          </h3>
          <div className="space-y-2">
            {stats.critical.map(p => (
              <button key={p.id} onClick={() => onProjectClick(p.id)} className="w-full text-left rounded-lg bg-danger/5 border border-danger/20 p-3 hover:bg-danger/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p.type === 'operacao' ? 'Operação' : 'Projeto'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.category} · {p.progress}%</p>
              </button>
            ))}
            {stats.critical.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
          </div>
        </div>

        {/* At Risk */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-warning mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Em Risco ({stats.atRisk.length})
          </h3>
          <div className="space-y-2">
            {stats.atRisk.map(p => (
              <button key={p.id} onClick={() => onProjectClick(p.id)} className="w-full text-left rounded-lg bg-warning/5 border border-warning/20 p-3 hover:bg-warning/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p.type === 'operacao' ? 'Operação' : 'Projeto'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.category} · {p.progress}%</p>
              </button>
            ))}
            {stats.atRisk.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
          </div>
        </div>

        {/* Stable */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Estáveis ({stats.stable.length})
          </h3>
          <div className="space-y-2">
            {stats.stable.map(p => (
              <button key={p.id} onClick={() => onProjectClick(p.id)} className="w-full text-left rounded-lg bg-success/5 border border-success/20 p-3 hover:bg-success/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p.type === 'operacao' ? 'Operação' : 'Projeto'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.category} · {p.progress}%</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" /> Top Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {stats.sortedTags.map(([tag, count]) => (
            <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
              {tag} <span className="text-muted-foreground ml-1">({count})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Team Overview */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Equipe ({stats.uniqueMembers.length} profissionais)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {stats.uniqueMembers.map(member => (
            <button
              key={member.name}
              onClick={() => onProfessionalClick(member.name)}
              className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shrink-0">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role} · {member.projectCount} projeto(s)</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
