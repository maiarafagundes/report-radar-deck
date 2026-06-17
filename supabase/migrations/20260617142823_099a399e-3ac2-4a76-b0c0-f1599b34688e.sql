ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.weekly_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_reports;