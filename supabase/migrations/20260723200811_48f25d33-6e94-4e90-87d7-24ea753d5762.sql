
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'stakeholder')
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.created_by = auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        JOIN public.professionals p ON lower(p.name) = lower(tm.name)
        WHERE tm.project_id = _project_id
          AND p.id = public.my_professional_id()
          AND public.has_role(auth.uid(),'tech_lead')
      )
$function$;
