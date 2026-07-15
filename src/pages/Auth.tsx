import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Activity, Loader2 } from 'lucide-react';

const ALLOWED_DOMAIN = '@v8.tech';

export default function Auth() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next');
  // Only allow same-origin relative paths as post-auth redirect targets.
  const nextPath = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (user) return <Navigate to={nextPath} replace />;

  const validateDomain = () => {
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      toast({ title: 'Domínio não permitido', description: 'Use um e-mail @v8.tech', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateDomain()) return;
    if (password.length < 6) { toast({ title: 'Senha curta', description: 'Mínimo 6 caracteres', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}${nextPath}`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
      });
      if (error) throw error;
      const { error: bootErr } = await supabase.rpc('bootstrap_profile' as any, { _full_name: fullName });
      if (bootErr) throw bootErr;
      toast({ title: 'Conta criada!', description: 'Aguardando aprovação de um administrador.' });
      navigate(nextPath, { replace: true });
    } catch (e: any) {
      toast({ title: 'Erro ao criar conta', description: e?.message ?? '', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // ensure profile exists (defensive)
      await supabase.rpc('bootstrap_profile' as any, { _full_name: '' });
      navigate(nextPath, { replace: true });
    } catch (e: any) {
      toast({ title: 'Erro ao entrar', description: e?.message ?? '', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{mode === 'signin' ? 'Entrar' : 'Solicitar acesso'}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Acesso restrito a usuários com e-mail <strong>@v8.tech</strong>. Novas contas precisam ser aprovadas por um administrador.
        </p>
        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <Label className="text-xs">Nome completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ana Silva" />
            </div>
          )}
          <div>
            <Label className="text-xs">E-mail (@v8.tech)</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@v8.tech" />
          </div>
          <div>
            <Label className="text-xs">Senha</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <Button className="w-full" disabled={busy} onClick={mode === 'signin' ? handleSignIn : handleSignUp}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'signin' ? 'Entrar' : 'Solicitar acesso')}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === 'signin' ? 'Não tem conta? Solicitar acesso' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}