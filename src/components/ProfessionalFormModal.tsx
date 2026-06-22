import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Professional, TeamMember } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pro: Professional) => Promise<void> | void;
  professional?: Professional | null;
}

const seniorities: TeamMember['seniority'][] = ['Junior', 'Pleno', 'Senior', 'Lead', 'Staff', 'Principal'];

const blank = {
  name: '',
  role: '',
  seniority: 'Pleno' as TeamMember['seniority'],
  resumo: '',
  certifications: '',
};

export default function ProfessionalFormModal({ isOpen, onClose, onSave, professional }: Props) {
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isEdit = !!professional;

  useEffect(() => {
    if (!isOpen) return;
    if (professional) {
      setForm({
        name: professional.name,
        role: professional.role ?? '',
        seniority: professional.seniority,
        resumo: professional.resumo ?? '',
        certifications: (professional.certifications ?? []).join('; '),
      });
    } else {
      setForm(blank);
    }
  }, [isOpen, professional]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const pro: Professional = {
        ...(professional ?? {} as Professional),
        id: professional?.id ?? crypto.randomUUID(),
        name: form.name.trim(),
        role: form.role.trim(),
        seniority: form.seniority,
        resumo: form.resumo.trim(),
        softSkills: professional?.softSkills ?? [],
        certifications: form.certifications.split(';').map(s => s.trim()).filter(Boolean),
        skills: professional?.skills ?? [],
        projectHistory: professional?.projectHistory ?? [],
      };
      await onSave(pro);
      toast({ title: isEdit ? 'Profissional atualizado' : 'Profissional cadastrado', description: pro.name });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e?.message ?? '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Profissional' : 'Cadastrar Profissional'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nome completo *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ana Silva" />
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="DevOps Engineer" />
            </div>
            <div>
              <Label className="text-xs">Senioridade</Label>
              <Select value={form.seniority} onValueChange={(v) => setForm({ ...form, seniority: v as TeamMember['seniority'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seniorities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Perfil / Resumo</Label>
            <Textarea
              value={form.resumo}
              onChange={e => setForm({ ...form, resumo: e.target.value })}
              placeholder="Profissional proativo com forte capacidade de comunicação..."
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs">Certificações <span className="text-muted-foreground">(separadas por ;)</span></Label>
            <Input
              value={form.certifications}
              onChange={e => setForm({ ...form, certifications: e.target.value })}
              placeholder="AWS Solutions Architect; CKA; GitHub Actions"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : (isEdit ? 'Salvar' : 'Cadastrar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}