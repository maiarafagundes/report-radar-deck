import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfessionalsDb } from '@/hooks/useProfessionalsDb';
import ProfessionalFormModal from './ProfessionalFormModal';
import { Professional } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

/** Shown automatically on first login (approved user without linked professional). */
export default function FirstTimeProfileSetup() {
  const { profile, user, refreshProfile } = useAuth();
  const { bulkUpsert } = useProfessionalsDb();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    if (profile && profile.status === 'approved' && !profile.professional_id) {
      setOpen(true);
    }
  }, [profile]);

  if (!profile || !user) return null;

  const handleSave = async (pro: Professional) => {
    submittedRef.current = true;
    const finalPro: Professional = { ...pro, name: pro.name || profile.full_name || profile.email.split('@')[0] };
    try {
      await bulkUpsert([finalPro]);
      const { data } = await supabase.from('professionals').select('id').eq('name', finalPro.name).maybeSingle();
      const proId = (data as any)?.id ?? finalPro.id;
      const { error } = await supabase.rpc('link_profile_to_professional' as any, { _user_id: user.id, _professional_id: proId });
      if (error) throw error;
      toast({ title: 'Perfil criado!', description: 'Seus dados foram salvos.' });
    } catch (e: any) {
      toast({ title: 'Aviso', description: e?.message ?? 'Falha ao vincular perfil.', variant: 'destructive' });
    } finally {
      setOpen(false);
      refreshProfile().catch(() => {});
    }
  };

  const seed: Professional = {
    id: crypto.randomUUID(),
    name: profile.full_name || '',
    role: 'Pleno',
    seniority: 'Pleno',
    resumo: '',
    softSkills: [],
    certifications: [],
    skills: [],
    projectHistory: [],
  };

  return (
    <ProfessionalFormModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onSave={handleSave}
      professional={seed}
    />
  );
}