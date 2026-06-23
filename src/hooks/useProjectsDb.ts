import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, WeeklyReport } from '@/types/project';
import {
  mapProjectFromDb,
  mapProjectToDb,
  mapReportToDb,
  mapTeamToDb,
} from '@/lib/projectMapper';

export function useProjectsDb() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [{ data: projs }, { data: teams }, { data: reports }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*'),
      supabase.from('weekly_reports').select('*'),
    ]);
    const built = (projs ?? []).map(p =>
      mapProjectFromDb(
        p,
        (teams ?? []).filter(t => t.project_id === p.id),
        (reports ?? []).filter(r => r.project_id === p.id),
      ),
    );
    setProjects(built);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Realtime: re-fetch on any change to projects/team/reports
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => { reload(); }, 250);
    };
    const channel = supabase
      .channel('projects-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_reports' }, trigger)
      .subscribe();
    return () => {
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [reload]);

  const createProject = useCallback(async (p: Project) => {
    const { error } = await supabase.from('projects').insert(mapProjectToDb(p));
    if (error) throw error;
    if (p.team.length) {
      const { error: e2 } = await supabase
        .from('team_members')
        .insert(p.team.map(m => mapTeamToDb(p.id, m)));
      if (e2) throw e2;
    }
    await reload();
  }, [reload]);

  const addReport = useCallback(async (projectId: string, report: WeeklyReport) => {
    const { error } = await supabase
      .from('weekly_reports')
      .insert(mapReportToDb(projectId, report));
    if (error) throw error;
    await supabase
      .from('projects')
      .update({ status: report.status })
      .eq('id', projectId);
    await reload();
  }, [reload]);

  const setProjectTeam = useCallback(async (projectId: string, team: import('@/types/project').TeamMember[]) => {
    const { error: delErr } = await supabase.from('team_members').delete().eq('project_id', projectId);
    if (delErr) throw delErr;
    if (team.length) {
      const { error: insErr } = await supabase
        .from('team_members')
        .insert(team.map(m => mapTeamToDb(projectId, m)));
      if (insErr) throw insErr;
    }
    await reload();
  }, [reload]);

  const updateProject = useCallback(async (p: Project) => {
    const { error } = await supabase.from('projects').update(mapProjectToDb(p)).eq('id', p.id);
    if (error) throw error;
    await reload();
  }, [reload]);

  const deleteProject = useCallback(async (projectId: string) => {
    await supabase.from('team_members').delete().eq('project_id', projectId);
    await supabase.from('weekly_reports').delete().eq('project_id', projectId);
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    await reload();
  }, [reload]);

  const bulkUpsertProjects = useCallback(async (incoming: Project[]) => {
    if (!incoming.length) return;
    const { error } = await supabase
      .from('projects')
      .upsert(incoming.map(mapProjectToDb), { onConflict: 'id' });
    if (error) throw error;

    for (const p of incoming) {
      await supabase.from('team_members').delete().eq('project_id', p.id);
      if (p.team.length) {
        await supabase.from('team_members').insert(p.team.map(m => mapTeamToDb(p.id, m)));
      }
      if (p.weeklyReports?.length) {
        await supabase
          .from('weekly_reports')
          .upsert(p.weeklyReports.map(r => mapReportToDb(p.id, r)), { onConflict: 'id' });
      }
    }
    await reload();
  }, [reload]);

  return { projects, loading, reload, createProject, updateProject, deleteProject, addReport, setProjectTeam, bulkUpsertProjects };
}