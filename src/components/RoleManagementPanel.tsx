import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Eye, Users2, Loader2, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invites, setInvites] = useState<Array<{ email: string; full_name: string; role: Role; consumed_at: string | null }>>([]);
  const [form, setForm] = useState<{ email: string; full_name: string; role: Role }>({ email: '', full_name: '', role: 'tech_lead' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: inv }] = await Promise.all([
      supabase.from('profiles' as any).select('id,email,full_name,status').eq('status', 'approved'),
      supabase.from('user_roles' as any).select('user_id,role'),
      supabase.from('user_invites' as any).select('email,full_name,role,consumed_at').order('created_at', { ascending: false }),
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
    setInvites(((inv as any[]) ?? []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitInvite = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^@\s]+@v8\.tech$/.test(email)) {
      toast({ title: 'Email inválido', description: 'Use um email @v8.tech.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('invite_user' as any, { _email: email, _full_name: form.full_name.trim(), _role: form.role });
      if (error) throw error;
      toast({ title: 'Convite criado', description: `${email} entrará já aprovado(a) ao se cadastrar.` });
      setForm({ email: '', full_name: '', role: 'tech_lead' });
      setInviteOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao convidar', description: e?.message ?? '', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const removeInvite = async (email: string) => {
    const { error } = await supabase.from('user_invites' as any).delete().eq('email', email);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    await load();
  };

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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Perfis de acesso ({rows.length})</h3>
        </div>
        <Button size="sm" className="h-7 gap-1" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" /> Convidar usuário
        </Button>
      </div>

      {invites.filter(i => !i.consumed_at).length > 0 && (
        <div className="mb-3 rounded-lg border border-border/60 bg-secondary/30 p-2">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Convites pendentes</p>
          <ul className="space-y-1">
            {invites.filter(i => !i.consumed_at).map(i => (
              <li key={i.email} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate"><span className="font-medium">{i.email}</span> <span className="text-muted-foreground">— {i.role === 'admin' ? 'Administrador' : i.role === 'tech_lead' ? 'Tech Lead' : 'Stakeholder'}</span></span>
                <button onClick={() => removeInvite(i.email)} className="text-muted-foreground hover:text-destructive" title="Remover convite">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum usuário aprovado.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const isAdmin = r.role === 'admin';
            const isSelf = user?.id === r.id;
            const canEditSelf = (user?.email ?? '').toLowerCase() === 'renan.alves@v8.tech';
            const lockSelf = isSelf && !canEditSelf;
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
                    disabled={busy === r.id || lockSelf}
                    onValueChange={(v) => setRole(r.id, v as Role)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[150px]" title={lockSelf ? 'Você não pode alterar seu próprio perfil' : ''}>
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