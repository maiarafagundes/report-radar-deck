
-- ============================================================
-- 1) executive_summaries: restrict read/write
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read executive summaries" ON public.executive_summaries;
DROP POLICY IF EXISTS "Authenticated can insert executive summaries" ON public.executive_summaries;

CREATE POLICY executive_summaries_read
  ON public.executive_summaries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'stakeholder'));

CREATE POLICY executive_summaries_admin_insert
  ON public.executive_summaries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- "Admins can manage executive summaries" (ALL) policy already exists for admin write paths.

-- ============================================================
-- 2) Split ALL write policies into INSERT/UPDATE/DELETE so that
--    SELECT remains governed only by the project-scoped policies
-- ============================================================

-- weekly_reports
DROP POLICY IF EXISTS weekly_reports_write ON public.weekly_reports;
CREATE POLICY weekly_reports_insert ON public.weekly_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY weekly_reports_update ON public.weekly_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY weekly_reports_delete ON public.weekly_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));

-- team_members
DROP POLICY IF EXISTS team_members_write ON public.team_members;
CREATE POLICY team_members_insert ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY team_members_update ON public.team_members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY team_members_delete ON public.team_members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));

-- client_contacts
DROP POLICY IF EXISTS client_contacts_write ON public.client_contacts;
CREATE POLICY client_contacts_insert ON public.client_contacts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY client_contacts_update ON public.client_contacts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));
CREATE POLICY client_contacts_delete ON public.client_contacts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'tech_lead') AND public.can_access_project(project_id)));

-- ============================================================
-- 3) Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_professional_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_project(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_profile_to_professional(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_profile_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_profile(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.profiles_protect_admin_fields() FROM PUBLIC, anon, authenticated;

-- Make sure authenticated keeps access to the RPCs/helpers it needs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_professional_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_profile_to_professional(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text) TO authenticated;
