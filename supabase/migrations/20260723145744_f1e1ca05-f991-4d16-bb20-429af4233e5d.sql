
-- Invites table: admin pre-registers users; on signup they are auto-approved with the assigned role.
CREATE TABLE public.user_invites (
  email text PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  role app_role NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invites TO authenticated;
GRANT ALL ON public.user_invites TO service_role;

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage invites"
ON public.user_invites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Admin-only RPC to create an invite (validates @v8.tech domain).
CREATE OR REPLACE FUNCTION public.invite_user(_email text, _full_name text, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _e text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _e !~ '^[^@]+@v8\.tech$' THEN RAISE EXCEPTION 'Apenas emails do domínio @v8.tech são permitidos'; END IF;
  IF _role NOT IN ('admin','tech_lead','stakeholder') THEN RAISE EXCEPTION 'invalid role'; END IF;

  INSERT INTO public.user_invites(email, full_name, role, invited_by)
  VALUES (_e, COALESCE(_full_name,''), _role, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        invited_by = EXCLUDED.invited_by,
        consumed_at = NULL,
        created_at = now();

  -- If the user already signed up, apply immediately.
  UPDATE public.profiles p
     SET status = 'approved', updated_at = now()
   WHERE lower(p.email) = _e;

  INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, _role FROM public.profiles p WHERE lower(p.email) = _e
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles ur
   USING public.profiles p
   WHERE ur.user_id = p.id AND lower(p.email) = _e AND ur.role <> _role;

  UPDATE public.user_invites SET consumed_at = now()
   WHERE email = _e AND EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = _e);
END;
$$;

REVOKE ALL ON FUNCTION public.invite_user(text, text, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_user(text, text, app_role) TO authenticated;

-- Update bootstrap_profile: if an invite exists, auto-approve and assign the invited role.
CREATE OR REPLACE FUNCTION public.bootstrap_profile(_full_name text DEFAULT ''::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _first_admin boolean;
  _status text;
  _invite record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL OR lower(_email) NOT LIKE '%@v8.tech' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @v8.tech são permitidos';
  END IF;

  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    RETURN (SELECT row_to_json(p) FROM public.profiles p WHERE id = _uid);
  END IF;

  SELECT * INTO _invite FROM public.user_invites WHERE email = lower(_email);

  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO _first_admin;

  IF _invite.email IS NOT NULL OR _first_admin THEN
    _status := 'approved';
  ELSE
    _status := 'pending';
  END IF;

  INSERT INTO public.profiles(id, email, full_name, status)
  VALUES (_uid, _email, COALESCE(NULLIF(_full_name,''), _invite.full_name, ''), _status);

  IF _first_admin THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin')
    ON CONFLICT DO NOTHING;
  ELSIF _invite.email IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, _invite.role)
    ON CONFLICT DO NOTHING;
    UPDATE public.user_invites SET consumed_at = now() WHERE email = _invite.email;
  END IF;

  RETURN (SELECT row_to_json(p) FROM public.profiles p WHERE id = _uid);
END;
$$;
