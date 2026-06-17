import { useEffect, useMemo, useRef, useState } from 'react';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, AlertTriangle, ListChecks, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TodoItem {
  acao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  responsavel: string;
}

interface HighlightItem {
  texto: string;
  projetos: string[];
}

interface RiskItem {
  texto: string;
  projetos: string[];
}

interface Summary {
  resumo: string;
  destaques: HighlightItem[];
  riscos: RiskItem[];
  todos: TodoItem[];
}

interface Props {
  projects: Project[];
}

const priorityColor = (p: TodoItem['prioridade']) => {
  if (p === 'alta') return 'bg-danger/10 text-danger border-danger/30';
  if (p === 'media') return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-success/10 text-success border-success/30';
};

const AIExecutiveSummary = ({ projects }: Props) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFingerprintRef = useRef<string>('');

  const fingerprint = useMemo(
    () => projects
      .map(p => `${p.id}:${p.status}:${p.progress}:${p.weeklyReports?.length ?? 0}`)
      .join('|'),
    [projects]
  );

  const generate = async (silent = false) => {
    if (!projects.length) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('executive-summary', {
        body: { projects },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data as Summary);
      setGeneratedAt(new Date());
      lastFingerprintRef.current = fingerprint;
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429')) toast.error('Limite de requisições atingido. Tente novamente em instantes.');
      else if (msg.includes('402')) toast.error('Créditos de IA esgotados. Adicione créditos no workspace.');
      else if (!silent) toast.error('Falha ao gerar status executivo: ' + msg);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-regenerate when project data changes (debounced)
  useEffect(() => {
    if (!autoUpdate) return;
    if (!projects.length) return;
    if (fingerprint === lastFingerprintRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { generate(true); }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, autoUpdate]);

  return (
    <div className="glass-card p-5 border border-primary/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Status Executivo Consolidado
              {autoUpdate && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-success/10 text-success border border-success/30">
                  Auto
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Análise inteligente de {projects.length} projetos com IA
              {generatedAt && ` · Atualizado ${generatedAt.toLocaleTimeString('pt-BR')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoUpdate(v => !v)}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border transition-colors ${
              autoUpdate
                ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
            }`}
            title="Liga/desliga atualização automática quando dados mudam"
          >
            Auto {autoUpdate ? 'ON' : 'OFF'}
          </button>
          <Button size="sm" onClick={() => generate(false)} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : summary ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analisando...' : summary ? 'Atualizar' : 'Gerar análise'}
          </Button>
        </div>
      </div>

      {!summary && !loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Clique em "Gerar análise" para consolidar resumo, destaques, riscos e TO-DOs do portfólio.
        </div>
      )}

      {loading && !summary && (
        <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Analisando portfólio...
        </div>
      )}

      {summary && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resumo</h3>
            <p className="text-sm text-foreground leading-relaxed">{summary.resumo}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-success mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Destaques
              </h3>
              <ul className="space-y-2">
                {summary.destaques.map((d, i) => (
                  <li key={i} className="text-sm text-foreground">
                    <div className="flex gap-2">
                      <span className="text-success mt-1">•</span>
                      <span>{d.texto}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 pl-4">
                      {d.projetos.map((nome, j) => (
                        <span key={j} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {nome}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-danger mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Riscos
              </h3>
              <ul className="space-y-2">
                {summary.riscos.map((r, i) => (
                  <li key={i} className="text-sm text-foreground">
                    <div className="flex gap-2">
                      <span className="text-danger mt-1">•</span>
                      <span>{r.texto}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 pl-4">
                      {r.projetos.map((nome, j) => (
                        <span key={j} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                          {nome}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5" /> TO-DOs Recomendados
            </h3>
            <div className="space-y-2">
              {summary.todos.map((t, i) => (
                <div key={i} className="rounded-lg bg-secondary/50 border border-border p-3 flex items-start gap-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${priorityColor(t.prioridade)} shrink-0`}>
                    {t.prioridade}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{t.acao}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">→ {t.responsavel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExecutiveSummary;