
-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'DevOps',
  type text NOT NULL DEFAULT 'projeto',
  status text NOT NULL DEFAULT 'on-track',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT CURRENT_DATE,
  progress integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_all" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- Team members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  seniority text NOT NULL DEFAULT 'Pleno',
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX team_members_project_idx ON public.team_members(project_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_all" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- Weekly reports
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  status text NOT NULL DEFAULT 'on-track',
  summary text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  blockers text[] NOT NULL DEFAULT '{}',
  in_progress text[] NOT NULL DEFAULT '{}',
  next_steps text[] NOT NULL DEFAULT '{}',
  indicators text[] NOT NULL DEFAULT '{}',
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_total integer NOT NULL DEFAULT 0,
  incidents_resolved integer NOT NULL DEFAULT 0,
  deployments_count integer NOT NULL DEFAULT 0,
  uptime_percent numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX weekly_reports_project_idx ON public.weekly_reports(project_id, week_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_reports TO anon, authenticated;
GRANT ALL ON public.weekly_reports TO service_role;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_reports_all" ON public.weekly_reports FOR ALL USING (true) WITH CHECK (true);

-- Professionals
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT '',
  seniority text NOT NULL DEFAULT 'Pleno',
  resumo text NOT NULL DEFAULT '',
  soft_skills text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO anon, authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professionals_all" ON public.professionals FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER professionals_updated_at BEFORE UPDATE ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
