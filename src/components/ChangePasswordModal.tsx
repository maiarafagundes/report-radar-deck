import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 6) { toast({ title: 'Senha curta', description: 'Mínimo 6 caracteres', variant: 'destructive' }); return; }
    if (password !== confirm) { toast({ title: 'Senhas diferentes', variant: 'destructive' }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Senha alterada com sucesso' });
    setPassword(''); setConfirm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
