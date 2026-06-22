import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Professional, TeamMember } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pro: Professional) => Promise<void> | void;
  professional?: Professional | null;
}

const cargos: TeamMember['seniority'][] = ['Estagiário', 'Junior', 'Pleno', 'Senior', 'Especialista', 'Coordenador', 'Gerente'];

const blank = {
  name: '',
  cargo: 'Pleno' as TeamMember['seniority'],
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
        cargo: (professional.seniority ?? professional.role ?? 'Pleno') as TeamMember['seniority'],
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
        role: form.cargo,
        seniority: form.cargo,
        resumo: professional?.resumo ?? '',
        softSkills: professional?.softSkills ?? [],
        certifications: professional?.certifications ?? [],
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
          <div>
            <Label className="text-xs">Nome completo *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ana Silva" />
          </div>
          <div>
            <Label className="text-xs">Cargo *</Label>
            <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v as TeamMember['seniority'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {cargos.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
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