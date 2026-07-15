import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';

// Typed shim for the beta supabase.auth.oauth namespace.
type AuthzResult = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_name?: string; redirect_uri?: string };
  scope?: string;
  scopes?: string[];
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthzResult | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthzResult | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthzResult | null; error: { message: string } | null }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<AuthzResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError('Parâmetro authorization_id ausente.');
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/auth?next=' + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError('O servidor de autorização não retornou uma URL de redirecionamento.');
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
          <h2 className="text-lg font-bold mb-2">Não foi possível carregar a autorização</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const clientName = details.client?.name ?? details.client?.client_name ?? 'um aplicativo externo';
  const scopeString = details.scopes?.join(' ') ?? details.scope ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card max-w-md w-full p-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">Conectar {clientName} à V8 Portfolio</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {clientName} poderá chamar as ferramentas do V8 Portfolio enquanto você estiver conectado.
          O acesso respeita seu perfil (admin, tech lead ou stakeholder) e as políticas de segurança do banco.
        </p>
        {scopeString && (
          <div className="mb-4 p-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">Permissões solicitadas</div>
            <div className="break-all">{scopeString}</div>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancelar conexão
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprovar'}
          </Button>
        </div>
      </div>
    </div>
  );
}