import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserX, Inbox, Loader2 } from 'lucide-react';

interface PendingProfile {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
}

export default function PendingRequestsPanel({ onApproved }: { onApproved?: () => void }) {
  const [items, setItems] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('id,email,full_name,status,created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setItems((data as any) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      const { error } = await supabase.rpc('set_profile_status' as any, { _user_id: id, _status: status });
      if (error) throw error;
      toast({ title: status === 'approved' ? 'Acesso aprovado' : 'Acesso recusado' });
      await load();
      onApproved?.();
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message ?? '', variant: 'destructive' });
    } finally { setBusyId(null); }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Solicitações de acesso ({items.length})</h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhuma solicitação pendente.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(p => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.full_name || p.email.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => decide(p.id, 'rejected')} className="gap-1 h-7">
                  <UserX className="h-3.5 w-3.5" /> Recusar
                </Button>
                <Button size="sm" disabled={busyId === p.id} onClick={() => decide(p.id, 'approved')} className="gap-1 h-7">
                  <UserCheck className="h-3.5 w-3.5" /> Aprovar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}