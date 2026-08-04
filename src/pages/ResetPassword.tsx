import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Activity, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) setReady(true); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 6) { toast({ title: 'Senha curta', description: 'Mínimo 6 caracteres', variant: 'destructive' }); return; }
    if (password !== confirm) { toast({ title: 'Senhas diferentes', variant: 'destructive' }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast({ title: 'Erro ao redefinir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Senha redefinida!', description: 'Você já está conectado.' });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Definir nova senha</h1>
        </div>
        {!ready ? (
          <p className="text-xs text-muted-foreground">
            Abra esta página pelo link enviado no e-mail de recuperação. Se você chegou aqui por engano, volte para <a className="text-primary underline" href="/auth">entrar</a>.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nova senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <div>
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••" />
            </div>
            <Button className="w-full" disabled={busy} onClick={submit}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
