import { useEffect, useRef, useState } from 'react';
import { Project } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, AlertTriangle, ListChecks, RefreshCw, Plus, Trash2 } from 'lucide-react';
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

export interface Summary {
  resumo: string;
  destaques: HighlightItem[];
  riscos: RiskItem[];
  todos: TodoItem[];
}

interface Props {
  projects: Project[];
  canRefresh?: boolean;
  onSummaryChange?: (summary: Summary | null) => void;
}

const priorityColor = (p: TodoItem['prioridade']) => {
  if (p === 'alta') return 'bg-danger/10 text-danger border-danger/30';
  if (p === 'media') return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-success/10 text-success border-success/30';
};

/** Most recent Monday 04:00 (local) on or before `now`. */
function lastMonday4(now: Date): Date {
  const r = new Date(now);
  r.setHours(4, 0, 0, 0);
  const day = r.getDay(); // 0=Sun..6=Sat
  const back = day === 0 ? 6 : day - 1;
  r.setDate(r.getDate() - back);
  if (r > now) r.setDate(r.getDate() - 7);
  return r;
}

const AIExecutiveSummary = ({ projects, canRefresh = false, onSummaryChange }: Props) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [savingTodos, setSavingTodos] = useState(false);
  const bootRef = useRef(false);

  // Load latest persisted summary from DB and decide whether to auto-refresh.
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    (async () => {
      const { data, error } = await supabase
        .from('executive_summaries')
        .select('id, payload, generated_at')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        // table might still be propagating; allow generation later
        return;
      }
      let lastGen: Date | null = null;
      if (data?.payload) {
        const s = data.payload as unknown as Summary;
        setSummary(s);
        setSummaryId((data as any).id ?? null);
        lastGen = new Date(data.generated_at as string);
        setGeneratedAt(lastGen);
        onSummaryChange?.(s);
      }
      // Weekly auto-refresh: regenerate if last Monday 04:00 has passed since last generation.
      if (projects.length) {
        const threshold = lastMonday4(new Date());
        if (!lastGen || lastGen < threshold) {
          generate(true);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  const generate = async (silent = false) => {
    if (!projects.length) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('executive-summary', {
        body: { projects },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const s = data as Summary;
      const at = new Date();
      setSummary(s);
      setGeneratedAt(at);
      onSummaryChange?.(s);
      // Persist to DB so every user sees the same latest analysis forever.
      const { data: userData } = await supabase.auth.getUser();
      const { data: ins, error: insErr } = await supabase.from('executive_summaries').insert({
        payload: s as any,
        generated_by: userData?.user?.id ?? null,
      }).select('id').maybeSingle();
      if (insErr) console.warn('Falha ao persistir status executivo:', insErr.message);
      else if (ins?.id) setSummaryId(ins.id);
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('429')) toast.error('Limite de requisições atingido. Tente novamente em instantes.');
      else if (msg.includes('402')) toast.error('Créditos de IA esgotados. Adicione créditos no workspace.');
      else if (!silent) toast.error('Falha ao gerar status executivo: ' + msg);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const persistTodos = async (next: TodoItem[]) => {
    if (!summary) return;
    const updated: Summary = { ...summary, todos: next };
    setSummary(updated);
    onSummaryChange?.(updated);
    if (!summaryId) return;
    setSavingTodos(true);
    const { error } = await supabase
      .from('executive_summaries')
      .update({ payload: updated as any })
      .eq('id', summaryId);
    setSavingTodos(false);
    if (error) toast.error('Falha ao salvar TO-DOs: ' + error.message);
  };

  const addTodo = () => {
    if (!summary) return;
    persistTodos([...summary.todos, { acao: '', prioridade: 'media', responsavel: '' }]);
  };
  const removeTodo = (i: number) => {
    if (!summary) return;
    persistTodos(summary.todos.filter((_, idx) => idx !== i));
  };
  const updateTodo = (i: number, patch: Partial<TodoItem>) => {
    if (!summary) return;
    persistTodos(summary.todos.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  };

  return (
    <div className="glass-card p-5 border border-primary/20">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Status Executivo Consolidado
            </h2>
            <p className="text-xs text-muted-foreground">
              Análise de {projects.length} projetos · atualização automática toda segunda às 04:00
              {generatedAt && ` · Atualizado ${generatedAt.toLocaleString('pt-BR')}`}
            </p>
          </div>
        </div>
        {canRefresh && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => generate(false)} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : summary ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Analisando...' : summary ? 'Atualizar' : 'Gerar análise'}
            </Button>
          </div>
        )}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5" /> TO-DOs Recomendados
                {savingTodos && <Loader2 className="h-3 w-3 animate-spin" />}
              </h3>
              {canRefresh && (
                <Button size="sm" variant="outline" className="gap-1 h-7 px-2" onClick={addTodo}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {summary.todos.map((t, i) => (
                <div key={i} className="rounded-lg bg-secondary/50 border border-border p-3 flex items-start gap-3">
                  {canRefresh ? (
                    <>
                      <Select value={t.prioridade} onValueChange={(v) => updateTodo(i, { prioridade: v as TodoItem['prioridade'] })}>
                        <SelectTrigger className={`h-7 w-[100px] text-[10px] font-bold uppercase ${priorityColor(t.prioridade)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex-1 min-w-0 space-y-1">
                        <Input value={t.acao} placeholder="Descreva a ação" className="h-8 text-sm" onChange={(e) => updateTodo(i, { acao: e.target.value })} />
                        <Input value={t.responsavel} placeholder="Responsável" className="h-7 text-xs" onChange={(e) => updateTodo(i, { responsavel: e.target.value })} />
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-danger hover:text-danger" onClick={() => removeTodo(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${priorityColor(t.prioridade)} shrink-0`}>
                        {t.prioridade}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{t.acao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">→ {t.responsavel}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {summary.todos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">Nenhum TO-DO. {canRefresh && 'Clique em "Adicionar" para criar um.'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExecutiveSummary;