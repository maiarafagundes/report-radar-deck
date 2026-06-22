
-- Helper: id do profissional vinculado ao usuário autenticado
CREATE OR REPLACE FUNCTION public.my_professional_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT professional_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: usuário pode acessar este projeto?
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        JOIN public.professionals p ON lower(p.name) = lower(tm.name)
        WHERE tm.project_id = _project_id
          AND p.id = public.my_professional_id()
      )
$$;

-- PROJECTS
DROP POLICY IF EXISTS projects_all ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT TO authenticated
  USING (public.can_access_project(id));
CREATE POLICY projects_admin_write ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TEAM_MEMBERS
DROP POLICY IF EXISTS team_members_all ON public.team_members;
CREATE POLICY team_members_select ON public.team_members FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY team_members_admin_write ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- WEEKLY_REPORTS
DROP POLICY IF EXISTS weekly_reports_all ON public.weekly_reports;
CREATE POLICY weekly_reports_select ON public.weekly_reports FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY weekly_reports_admin_write ON public.weekly_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFESSIONALS
DROP POLICY IF EXISTS professionals_all ON public.professionals;
CREATE POLICY professionals_select ON public.professionals FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR id = public.my_professional_id()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE lower(tm.name) = lower(professionals.name)
        AND public.can_access_project(tm.project_id)
    )
  );
CREATE POLICY professionals_admin_write ON public.professionals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
