import { useMemo, useState } from 'react';
import { Project, Professional } from '@/types/project';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, AlertCircle, FolderKanban, Wrench, Briefcase, ShieldCheck, UserCheck, X } from 'lucide-react';
import AIExecutiveSummary from './AIExecutiveSummary';
import LiveStatusBoard from './LiveStatusBoard';

interface ExecutiveDashboardProps {
  projects: Project[];
  professionals: Professional[];
  onProfessionalClick: (name: string) => void;
  onProjectClick: (id: string) => void;
}

const ExecutiveDashboard = ({ projects, professionals, onProfessionalClick, onProjectClick }: ExecutiveDashboardProps) => {
  const [selectedSituation, setSelectedSituation] = useState<null | 'stable' | 'atRisk' | 'critical'>(null);

  const situationStyles = {
    success: {
      text: 'text-success',
      icon: 'text-success',
      activeRing: 'ring-2 ring-success/40 border-success/50',
      hoverBorder: 'hover:border-success/40',
      cardBg: 'bg-success/5 border-success/20 hover:bg-success/10',
    },
    warning: {
      text: 'text-warning',
      icon: 'text-warning',
      activeRing: 'ring-2 ring-warning/40 border-warning/50',
      hoverBorder: 'hover:border-warning/40',
      cardBg: 'bg-warning/5 border-warning/20 hover:bg-warning/10',
    },
    danger: {
      text: 'text-danger',
      icon: 'text-danger',
      activeRing: 'ring-2 ring-danger/40 border-danger/50',
      hoverBorder: 'hover:border-danger/40',
      cardBg: 'bg-danger/5 border-danger/20 hover:bg-danger/10',
    },
  } as const;
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
      sustentacao: projects.filter(p => p.type === 'sustentacao'),
      dedicado: projects.filter(p => p.type === 'dedicado'),
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

  const getTypeLabel = (type: Project['type']) => {
    switch (type) {
      case 'operacao': return 'Operação';
      case 'sustentacao': return 'Sustentação';
      case 'dedicado': return 'Dedicado';
      default: return 'Projeto';
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <LiveStatusBoard projects={projects} onProjectClick={onProjectClick} />
      <AIExecutiveSummary projects={projects} />
      {/* Modelos de Atendimento */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Modelos de Atendimento</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <ShieldCheck className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.byType.sustentacao.length}</p>
            <p className="text-xs text-muted-foreground">Sustentação</p>
          </div>
          <div className="glass-card p-4 text-center">
            <UserCheck className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.byType.dedicado.length}</p>
            <p className="text-xs text-muted-foreground">Dedicado (Body Shop)</p>
          </div>
        </div>
      </div>

      {/* Situação */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Situação</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {([
            { key: 'stable',   label: 'Estáveis', count: stats.stable.length,   color: 'success', Icon: CheckCircle },
            { key: 'atRisk',   label: 'Em Risco', count: stats.atRisk.length,   color: 'warning', Icon: AlertTriangle },
            { key: 'critical', label: 'Críticos', count: stats.critical.length, color: 'danger',  Icon: AlertCircle },
          ] as const).map(({ key, label, count, color, Icon }) => {
            const active = selectedSituation === key;
            const s = situationStyles[color];
            return (
              <button
                key={key}
                onClick={() => setSelectedSituation(active ? null : key)}
                className={`glass-card p-4 text-center transition-all ${s.hoverBorder} hover:-translate-y-0.5 ${active ? s.activeRing : ''}`}
              >
                <Icon className={`mx-auto h-5 w-5 ${s.icon} mb-1`} />
                <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </button>
            );
          })}
        </div>

        {selectedSituation && (
          <div className="mt-3 glass-card p-4 animate-slide-in">
            {(() => {
              const conf = {
                stable:   { list: stats.stable,   label: 'Estáveis', color: 'success', Icon: CheckCircle },
                atRisk:   { list: stats.atRisk,   label: 'Em Risco', color: 'warning', Icon: AlertTriangle },
                critical: { list: stats.critical, label: 'Críticos', color: 'danger',  Icon: AlertCircle },
              }[selectedSituation] as { list: Project[]; label: string; color: 'success'|'warning'|'danger'; Icon: typeof CheckCircle };
              const Icon = conf.Icon;
              const s = situationStyles[conf.color];
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-bold ${s.text} flex items-center gap-2`}>
                      <Icon className="h-4 w-4" /> {conf.label} ({conf.list.length})
                    </h3>
                    <button
                      onClick={() => setSelectedSituation(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Fechar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {conf.list.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">Nenhum projeto nesta situação.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {conf.list.map(p => (
                        <button
                          key={p.id}
                          onClick={() => onProjectClick(p.id)}
                          className={`text-left rounded-lg border p-3 transition-colors ${s.cardBg}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">{getTypeLabel(p.type)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{p.category} · {p.progress}%</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
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

    </div>
  );
};

export default ExecutiveDashboard;
