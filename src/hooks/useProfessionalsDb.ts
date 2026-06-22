import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Professional } from '@/types/project';
import { mapProfessionalFromDb, mapProfessionalToDb } from '@/lib/projectMapper';

export function useProfessionalsDb() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('professionals').select('*').order('name');
    setProfessionals((data ?? []).map(mapProfessionalFromDb));
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const bulkUpsert = useCallback(async (incoming: Professional[]) => {
    if (!incoming.length) return;
    const { error } = await supabase
      .from('professionals')
      .upsert(incoming.map(mapProfessionalToDb), { onConflict: 'name' });
    if (error) throw error;
    await reload();
  }, [reload]);

  const deleteProfessional = useCallback(async (id: string) => {
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw error;
    await reload();
  }, [reload]);

  const updateProfessional = useCallback(async (pro: Professional) => {
    const { error } = await supabase
      .from('professionals')
      .update(mapProfessionalToDb(pro))
      .eq('id', pro.id);
    if (error) throw error;
    await reload();
  }, [reload]);

  return { professionals, loading, reload, bulkUpsert, deleteProfessional, updateProfessional };
}