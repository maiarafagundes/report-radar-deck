import { useEffect, useMemo, useState } from 'react';
import { Project, ProjectStatus } from '@/types/project';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle, Clock, Radio } from 'lucide-react';

interface Props {
  projects: Project[];
  onProjectClick: (id: string) => void;
}

const statusMeta: Record<ProjectStatus, { label: string; dot: string; ring: string; chip: string; icon: any }> = {
  'on-track':  { label: 'No prazo',  dot: 'bg-success',  ring: 'ring-success/30',  chip: 'bg-success/10 text-success border-success/30',   icon: CheckCircle2 },
  'completed': { label: 'Concluído', dot: 'bg-primary',  ring: 'ring-primary/30',  chip: 'bg-primary/10 text-primary border-primary/30',   icon: CheckCircle2 },
  'at-risk':   { label: 'Em risco',  dot: 'bg-warning',  ring: 'ring-warning/30',  chip: 'bg-warning/10 text-warning border-warning/30',   icon: AlertTriangle },
  'delayed':   { label: 'Atrasado',  dot: 'bg-danger',   ring: 'ring-danger/30',   chip: 'bg-danger/10 text-danger border-danger/30',      icon: AlertCircle },
};

const LiveStatusBoard = ({ projects, onProjectClick }: Props) => {
  const [flash, setFlash] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());

  // Track status changes to briefly highlight updated cards
  const fingerprint = useMemo(
    () => projects.map(p => `${p.id}:${p.status}:${p.progress}`).join('|'),
    [projects]
  );
  const [prevFp, setPrevFp] = useState(fingerprint);
  useEffect(() => {
    if (prevFp === fingerprint) return;
    const prevMap = new Map(prevFp.split('|').filter(Boolean).map(s => {
      const [id, status, progress] = s.split(':');
      return [id, `${status}:${progress}`];
    }));
    const updates: Record<string, number> = {};
    projects.forEach(p => {
      const prev = prevMap.get(p.id);
      const cur = `${p.status}:${p.progress}`;
      if (prev && prev !== cur) updates[p.id] = Date.now();
    });
    if (Object.keys(updates).length) {
      setFlash(f => ({ ...f, ...updates }));
      setTimeout(() => setNow(Date.now()), 2100);
    }
    setPrevFp(fingerprint);
  }, [fingerprint, prevFp, projects]);

  // Tick every minute for relative "last updated"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const lastUpdate = useMemo(() => {
    const reports = projects.flatMap(p => p.weeklyReports || []);
    if (!reports.length) return null;
    return reports.map(r => new Date(r.weekEnd).getTime()).sort((a, b) => b - a)[0];
  }, [projects]);

  const ordered = useMemo(() => {
    const order: Record<ProjectStatus, number> = { 'delayed': 0, 'at-risk': 1, 'on-track': 2, 'completed': 3 };
    return [...projects].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  }, [projects]);

  return (
    <div className="glass-card p-5 border border-primary/10">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="rounded-lg bg-primary/10 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Status ao vivo
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-success/10 text-success border border-success/30 flex items-center gap-1">
                <Radio className="h-2.5 w-2.5" /> Live
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Atualiza automaticamente a cada save · {projects.length} projetos
              {lastUpdate && ` · Último relatório ${relative(now - lastUpdate)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ordered.map(p => {
          const meta = statusMeta[p.status];
          const Icon = meta.icon;
          const flashed = flash[p.id] && Date.now() - flash[p.id] < 2000;
          return (
            <button
              key={p.id}
              onClick={() => onProjectClick(p.id)}
              className={`group relative text-left rounded-xl border border-border/60 bg-card/60 backdrop-blur hover:border-primary/40 hover:bg-card transition-all p-3 overflow-hidden ${flashed ? `ring-2 ${meta.ring} animate-pulse-once` : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`relative flex h-2 w-2 shrink-0`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meta.dot} opacity-60`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${meta.dot}`} />
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">{p.name}</span>
                </div>
                <Icon className={`h-3.5 w-3.5 shrink-0 ${
                  p.status === 'delayed' ? 'text-danger' :
                  p.status === 'at-risk' ? 'text-warning' :
                  p.status === 'completed' ? 'text-primary' : 'text-success'
                }`} />
              </div>
              <div className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${meta.chip} mb-2`}>
                {meta.label}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{p.category}</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      p.status === 'delayed' ? 'bg-danger' :
                      p.status === 'at-risk' ? 'bg-warning' :
                      p.status === 'completed' ? 'bg-primary' : 'bg-success'
                    }`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                {p.weeklyReports?.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {relative(now - new Date(p.weeklyReports[p.weeklyReports.length - 1].weekEnd).getTime())}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {!projects.length && (
          <div className="col-span-full text-center py-6 text-sm text-muted-foreground">
            Nenhum projeto cadastrado.
          </div>
        )}
      </div>
    </div>
  );
};

function relative(deltaMs: number): string {
  const s = Math.max(0, Math.floor(deltaMs / 1000));
  if (s < 60) return 'agora há pouco';
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  const w = Math.floor(d / 7);
  return `há ${w}sem`;
}

export default LiveStatusBoard;