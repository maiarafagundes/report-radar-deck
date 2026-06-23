
-- Rename role 'member' to 'tech_lead'
ALTER TYPE public.app_role RENAME VALUE 'member' TO 'tech_lead';

-- Tech leads see all projects (same as admin)
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'tech_lead')
$$;

-- Projects: split write policies (admin OR tech_lead can insert/update; only admin can delete)
DROP POLICY IF EXISTS projects_admin_write ON public.projects;
CREATE POLICY projects_insert ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'));
CREATE POLICY projects_update ON public.projects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'));
CREATE POLICY projects_delete ON public.projects
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Team members: admin + tech_lead full write
DROP POLICY IF EXISTS team_members_admin_write ON public.team_members;
CREATE POLICY team_members_write ON public.team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'));

-- Weekly reports: admin + tech_lead full write
DROP POLICY IF EXISTS weekly_reports_admin_write ON public.weekly_reports;
CREATE POLICY weekly_reports_write ON public.weekly_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tech_lead'));

-- RPC: admin sets a user's role (admin <-> tech_lead). Ensures user has exactly one of the two roles.
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _role NOT IN ('admin','tech_lead') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role <> _role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- On approval, default new users to tech_lead so they can access the app
CREATE OR REPLACE FUNCTION public.set_profile_status(_user_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.profiles SET status=_status, updated_at=now() WHERE id = _user_id;
  IF _status = 'approved' AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'tech_lead');
  END IF;
END;
$$;
