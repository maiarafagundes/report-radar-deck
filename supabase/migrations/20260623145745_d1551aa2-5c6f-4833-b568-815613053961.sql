
-- Restrict tech_lead to own projects; allow stakeholder read-only on everything needed for dashboard/allocation.
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'stakeholder')
      OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        JOIN public.professionals p ON lower(p.name) = lower(tm.name)
        WHERE tm.project_id = _project_id
          AND p.id = public.my_professional_id()
          AND public.has_role(auth.uid(),'tech_lead')
      )
$$;

-- Projects writes: admin OR (tech_lead AND owns project). Recreate to be explicit.
DROP POLICY IF EXISTS projects_techlead_write ON public.projects;
CREATE POLICY projects_techlead_write ON public.projects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(id))
  WITH CHECK (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(id));

DROP POLICY IF EXISTS projects_techlead_insert ON public.projects;
CREATE POLICY projects_techlead_insert ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'tech_lead') OR public.has_role(auth.uid(),'admin'));

-- Allow set_user_role to also assign stakeholder
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _role NOT IN ('admin','tech_lead','stakeholder') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role <> _role;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
