import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (profile && profile.status === 'approved' && !profile.professional_id) {
      setOpen(true);
    }
  }, [profile]);

  if (!profile || !user) return null;

  const handleSave = async (pro: Professional) => {
    const finalPro: Professional = { ...pro, name: pro.name || profile.full_name || profile.email.split('@')[0] };
    await bulkUpsert([finalPro]);
    // re-read by name to get the (possibly upserted) id
    const { data } = await supabase.from('professionals').select('id').eq('name', finalPro.name).maybeSingle();
    const proId = (data as any)?.id ?? finalPro.id;
    const { error } = await supabase.rpc('link_profile_to_professional' as any, { _user_id: user.id, _professional_id: proId });
    if (error) { toast({ title: 'Erro ao vincular perfil', description: error.message, variant: 'destructive' }); return; }
    await refreshProfile();
    setOpen(false);
    toast({ title: 'Perfil criado!', description: 'Seus dados foram salvos.' });
  };

  const seed: Professional = {
    id: crypto.randomUUID(),
    name: profile.full_name || '',
    role: '',
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
      onClose={() => { /* must complete */ }}
      onSave={handleSave}
      professional={seed}
    />
  );
}