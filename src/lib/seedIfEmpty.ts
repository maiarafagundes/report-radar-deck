import { supabase } from '@/integrations/supabase/client';
import { mockProjects } from '@/data/mockProjects';
import { mockProfessionals } from '@/data/mockProfessionals';
import {
  mapProjectToDb,
  mapTeamToDb,
  mapReportToDb,
  mapProfessionalToDb,
} from './projectMapper';

let seedRan = false;

export async function seedIfEmpty() {
  if (seedRan) return false;
  seedRan = true;

  const { count: projCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true });
  const { count: proCount } = await supabase
    .from('professionals')
    .select('id', { count: 'exact', head: true });

  let seeded = false;

  if ((projCount ?? 0) === 0) {
    await supabase.from('projects').insert(mockProjects.map(mapProjectToDb));
    const teamRows = mockProjects.flatMap(p => p.team.map(m => mapTeamToDb(p.id, m)));
    if (teamRows.length) await supabase.from('team_members').insert(teamRows);
    const reportRows = mockProjects.flatMap(p =>
      (p.weeklyReports ?? []).map(r => mapReportToDb(p.id, r)),
    );
    if (reportRows.length) await supabase.from('weekly_reports').insert(reportRows);
    seeded = true;
  }

  if ((proCount ?? 0) === 0 && mockProfessionals.length) {
    await supabase
      .from('professionals')
      .upsert(mockProfessionals.map(mapProfessionalToDb), { onConflict: 'name' });
    seeded = true;
  }

  return seeded;
}