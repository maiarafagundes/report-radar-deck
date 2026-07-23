import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, XCircle, UserCog } from 'lucide-react';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, isStakeholder, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  if (!profile || profile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <Clock className="mx-auto h-10 w-10 text-warning mb-3" />
          <h2 className="text-lg font-bold mb-2">Aguardando aprovação</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sua solicitação de acesso foi registrada. Um administrador precisa aprovar antes de você poder acessar o sistema.
          </p>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
          <h2 className="text-lg font-bold mb-2">Acesso negado</h2>
          <p className="text-sm text-muted-foreground mb-6">Sua solicitação de acesso foi rejeitada. Entre em contato com um administrador.</p>
          <Button variant="outline" onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}