import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Eye, Users2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Role = 'admin' | 'tech_lead' | 'stakeholder';

interface RowUser {
  id: string;
  email: string;
  full_name: string;
  role: Role | null;
}

export default function RoleManagementPanel() {
  const [rows, setRows] = useState<RowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles' as any).select('id,email,full_name,status').eq('status', 'approved'),
      supabase.from('user_roles' as any).select('user_id,role'),
    ]);
    const roleByUser = new Map<string, Role>();
    ((roles as any[]) ?? []).forEach((r) => roleByUser.set(r.user_id, r.role));
    const list: RowUser[] = ((profiles as any[]) ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name || p.email.split('@')[0],
      role: roleByUser.get(p.id) ?? null,
    }));
    list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setRole = async (userId: string, role: Role) => {
    setBusy(userId);
    try {
      const { error } = await supabase.rpc('set_user_role' as any, { _user_id: userId, _role: role });
      if (error) throw error;
      toast({ title: 'Perfil atualizado', description: role === 'admin' ? 'Usuário agora é Administrador.' : role === 'tech_lead' ? 'Usuário agora é Tech Lead.' : 'Usuário agora é Stakeholder.' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar perfil', description: e?.message ?? '', variant: 'destructive' });
    } finally { setBusy(null); }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Perfis de acesso ({rows.length})</h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum usuário aprovado.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const isAdmin = r.role === 'admin';
            const isSelf = user?.id === r.id;
            const label = r.role === 'admin' ? 'Administrador' : r.role === 'tech_lead' ? 'Tech Lead' : r.role === 'stakeholder' ? 'Stakeholder' : 'Sem perfil';
            const Icon = isAdmin ? ShieldCheck : r.role === 'stakeholder' ? Eye : Shield;
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${isAdmin ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <Select
                    value={r.role ?? undefined}
                    disabled={busy === r.id || isSelf}
                    onValueChange={(v) => setRole(r.id, v as Role)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[150px]" title={isSelf ? 'Você não pode alterar seu próprio perfil' : ''}>
                      {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue placeholder="Definir perfil" />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="tech_lead">Tech Lead</SelectItem>
                      <SelectItem value="stakeholder">Stakeholder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}