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
    // Remap mock ids (e.g. "1", "t1", "r1") to UUIDs so Postgres accepts them
    const idMap = new Map<string, string>();
    const getId = (oldId: string) => {
      if (!idMap.has(oldId)) idMap.set(oldId, crypto.randomUUID());
      return idMap.get(oldId)!;
    };
    const projectsWithUuid = mockProjects.map(p => ({ ...p, id: getId(p.id) }));
    await supabase.from('projects').insert(projectsWithUuid.map(mapProjectToDb));
    const teamRows = mockProjects.flatMap(p =>
      p.team.map(m => mapTeamToDb(getId(p.id), { ...m, id: crypto.randomUUID() })),
    );
    if (teamRows.length) await supabase.from('team_members').insert(teamRows);
    const reportRows = mockProjects.flatMap(p =>
      (p.weeklyReports ?? []).map(r =>
        mapReportToDb(getId(p.id), { ...r, id: crypto.randomUUID() }),
      ),
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