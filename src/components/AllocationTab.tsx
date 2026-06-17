import { useMemo, useState } from 'react';
import { Professional, Project } from '@/types/project';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  Users, AlertTriangle, CheckCircle2, TrendingDown, Activity,
  Briefcase, Search, Gauge,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AllocationTabProps {
  professionals: Professional[];
  projects: Project[];
  onProfessionalClick?: (name: string) => void;
}

type Bucket = 'bench' | 'optimal' | 'overload' | 'under';

/** Color rules per user request: >100% red, =100% green, <100% blue */
const bucketColor: Record<Bucket, { hsl: string; ring: string; bg: string; text: string; label: string }> = {
  bench:    { hsl: 'hsl(var(--muted-foreground))', ring: 'ring-muted-foreground/40', bg: 'bg-muted-foreground/15', text: 'text-muted-foreground', label: 'Sem alocação' },
  under:    { hsl: 'hsl(var(--primary))',          ring: 'ring-primary/40',          bg: 'bg-primary/15',          text: 'text-primary',          label: 'Abaixo de 100%' },
  optimal:  { hsl: 'hsl(var(--success))',          ring: 'ring-success/40',          bg: 'bg-success/15',          text: 'text-success',          label: '100% — Saudável' },
  overload: { hsl: 'hsl(var(--danger))',           ring: 'ring-danger/40',           bg: 'bg-danger/15',           text: 'text-danger',           label: 'Acima de 100% (Sobrecarga)' },
};

const getBucket = (total: number): Bucket => {
  if (total <= 0) return 'bench';
  if (total < 100) return 'under';
  if (total === 100) return 'optimal';
  return 'overload';
};

const allocationClasses = (total: number) => {
  // user rule: >100 red, =100 green, <100 blue (bench => keep blue-ish gray)
  if (total > 100) return 'text-danger';
  if (total === 100) return 'text-success';
  return 'text-primary';
};

const barColor = (total: number) => {
  if (total > 100) return 'hsl(var(--danger))';
  if (total === 100) return 'hsl(var(--success))';
  return 'hsl(var(--primary))';
};

const AllocationTab = ({ professionals, projects, onProfessionalClick }: AllocationTabProps) => {
  const [search, setSearch] = useState('');
  const [bucketFilter, setBucketFilter] = useState<Bucket | 'all'>('all');

  /** Build allocation index from project.team[] */
  const peopleAllocation = useMemo(() => {
    // key by lowercased name (professionals + team_members aren't FK-bound)
    const map = new Map<string, {
      name: string;
      role: string;
      seniority: string;
      total: number;
      allocations: { projectId: string; projectName: string; percent: number; type: string }[];
      isRegistered: boolean;
    }>();

    professionals.forEach(p => {
      map.set(p.name.toLowerCase(), {
        name: p.name, role: p.role, seniority: p.seniority,
        total: 0, allocations: [], isRegistered: true,
      });
    });

    projects.forEach(proj => {
      proj.team.forEach(m => {
        const key = m.name.toLowerCase();
        const entry = map.get(key) ?? {
          name: m.name, role: m.role, seniority: m.seniority,
          total: 0, allocations: [], isRegistered: false,
        };
        const pct = typeof m.allocationPercent === 'number' ? m.allocationPercent : 100;
        entry.total += pct;
        entry.allocations.push({ projectId: proj.id, projectName: proj.name, percent: pct, type: proj.type });
        map.set(key, entry);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [professionals, projects]);

  /** KPIs */
  const kpis = useMemo(() => {
    const total = peopleAllocation.length;
    const buckets = { bench: 0, under: 0, optimal: 0, overload: 0 };
    let sum = 0;
    peopleAllocation.forEach(p => { buckets[getBucket(p.total)]++; sum += p.total; });

    const avg = total ? Math.round(sum / total) : 0;
    const allocatedHeadcount = total - buckets.bench;
    const billability = total ? Math.round((allocatedHeadcount / total) * 100) : 0;

    // FTE equivalents (% / 100). Capacity = total professionals.
    const usedFTE = sum / 100;
    const capacityFTE = total; // 1 FTE por pessoa
    const idleFTE = Math.max(0, capacityFTE - usedFTE);
    const utilization = capacityFTE ? Math.round((usedFTE / capacityFTE) * 100) : 0;

    // Ociosidade total apenas para pessoas sub-alocadas
    const idleCapacity = peopleAllocation.reduce((acc, p) => acc + Math.max(0, 100 - p.total), 0);
    const overCapacity = peopleAllocation.reduce((acc, p) => acc + Math.max(0, p.total - 100), 0);

    return { total, buckets, avg, billability, usedFTE, capacityFTE, idleFTE, utilization, idleCapacity, overCapacity, allocatedHeadcount };
  }, [peopleAllocation]);

  /** Per-project totals */
  const projectAllocations = useMemo(() => {
    return projects.map(p => {
      const total = p.team.reduce((acc, m) => acc + (m.allocationPercent ?? 100), 0);
      return {
        name: p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name,
        fullName: p.name,
        total,
        headcount: p.team.length,
        fte: +(total / 100).toFixed(2),
      };
    }).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [projects]);

  const distributionData = [
    { name: 'Sem alocação', value: kpis.buckets.bench, color: bucketColor.bench.hsl },
    { name: 'Abaixo de 100%', value: kpis.buckets.under, color: bucketColor.under.hsl },
    { name: '100% Saudável', value: kpis.buckets.optimal, color: bucketColor.optimal.hsl },
    { name: 'Sobrecarga', value: kpis.buckets.overload, color: bucketColor.overload.hsl },
  ].filter(d => d.value > 0);

  const filtered = useMemo(() => {
    return peopleAllocation.filter(p => {
      if (bucketFilter !== 'all' && getBucket(p.total) !== bucketFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.role.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [peopleAllocation, bucketFilter, search]);

  return (
    <div className="space-y-5 animate-slide-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard icon={<Users className="h-5 w-5 text-primary" />} label="Profissionais" value={kpis.total} hint={`${kpis.allocatedHeadcount} alocados`} />
        <KpiCard icon={<Gauge className="h-5 w-5 text-primary" />} label="Utilização Média" value={`${kpis.avg}%`} hint="Por profissional" valueClass={allocationClasses(kpis.avg)} />
        <KpiCard icon={<Activity className="h-5 w-5 text-primary" />} label="Billability" value={`${kpis.billability}%`} hint="% com alocação" />
        <KpiCard icon={<Briefcase className="h-5 w-5 text-primary" />} label="FTE Em Uso" value={kpis.usedFTE.toFixed(1)} hint={`de ${kpis.capacityFTE} FTE`} />
        <KpiCard icon={<TrendingDown className="h-5 w-5 text-primary" />} label="Capacidade Ociosa" value={`${kpis.idleCapacity}%`} hint={`${(kpis.idleCapacity/100).toFixed(1)} FTE livre`} valueClass="text-primary" />
        <KpiCard icon={<AlertTriangle className="h-5 w-5 text-danger" />} label="Sobrecarga" value={`${kpis.overCapacity}%`} hint={`${kpis.buckets.overload} pessoa(s)`} valueClass="text-danger" />
      </div>

      {/* Bucket summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['bench','under','optimal','overload'] as Bucket[]).map(k => {
          const c = bucketColor[k];
          const active = bucketFilter === k;
          return (
            <button
              key={k}
              onClick={() => setBucketFilter(active ? 'all' : k)}
              className={`glass-card p-3 text-left transition-all ${active ? `ring-2 ${c.ring}` : 'hover:ring-1 hover:ring-border'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
                {k === 'optimal' && <CheckCircle2 className={`h-4 w-4 ${c.text}`} />}
                {k === 'overload' && <AlertTriangle className={`h-4 w-4 ${c.text}`} />}
              </div>
              <p className={`text-2xl font-bold mt-1 ${c.text}`}>{kpis.buckets[k]}</p>
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Alocação por Projeto (%)</h3>
          {projectAllocations.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma alocação registrada nos projetos.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectAllocations} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="category" dataKey="name" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, _name, item: any) => [`${value}% (${item.payload.fte} FTE)`, item.payload.fullName]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {projectAllocations.map((p, i) => <Cell key={i} fill={barColor(p.total)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Distribuição da Equipe</h3>
          {distributionData.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados de alocação.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {distributionData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n: any) => [`${v} pessoa(s)`, n]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* People list */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-foreground">Controle de Alocação por Profissional</h3>
          <div className="flex items-center gap-2">
            {bucketFilter !== 'all' && (
              <button onClick={() => setBucketFilter('all')} className="text-xs text-muted-foreground hover:text-foreground underline">
                Limpar filtro
              </button>
            )}
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
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum profissional encontrado.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const bucket = getBucket(p.total);
              const c = bucketColor[bucket];
              const widthPct = Math.min(150, p.total); // cap visual at 150%
              return (
                <div
                  key={p.name}
                  onClick={() => onProfessionalClick?.(p.name)}
                  className="rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary shrink-0">
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.name}
                            {!p.isRegistered && <span className="ml-2 text-[10px] uppercase tracking-wider text-warning">não cadastrado</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.role || '—'} · {p.seniority} · {p.allocations.length} projeto(s)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-bold ${allocationClasses(p.total)}`}>{p.total}%</p>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                        </div>
                      </div>

                      {/* progress bar */}
                      <div className="mt-2 h-2 rounded-full bg-background/60 overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(widthPct / 150) * 100}%`, background: barColor(p.total) }}
                        />
                        {/* 100% marker */}
                        <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: `${(100/150)*100}%` }} />
                      </div>

                      {p.allocations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.allocations.map((a, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${c.bg} ${c.text}`}
                            >
                              {a.projectName} · {a.percent}%
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, hint, valueClass }: { icon: React.ReactNode; label: string; value: string | number; hint?: string; valueClass?: string }) => (
  <div className="glass-card p-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      {icon}
    </div>
    <p className={`text-xl font-bold ${valueClass ?? 'text-foreground'}`}>{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
  </div>
);

export default AllocationTab;