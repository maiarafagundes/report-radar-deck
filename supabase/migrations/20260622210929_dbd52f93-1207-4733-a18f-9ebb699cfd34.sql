
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','member');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  professional_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_status_chk CHECK (status IN ('pending','approved','rejected'))
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "users update own profile fields" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Block users from changing their own status/professional_id linkage via update policy:
-- Use a trigger to revert protected fields if updater isn't admin.
CREATE OR REPLACE FUNCTION public.profiles_protect_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status := OLD.status;
    NEW.professional_id := OLD.professional_id;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_protect_admin_fields_trg BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_admin_fields();

-- Bootstrap profile after signup. Validates domain server-side.
CREATE OR REPLACE FUNCTION public.bootstrap_profile(_full_name text DEFAULT '')
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _first_admin boolean;
  _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL OR lower(_email) NOT LIKE '%@v8.tech' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @v8.tech são permitidos';
  END IF;

  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    RETURN (SELECT row_to_json(p) FROM public.profiles p WHERE id = _uid);
  END IF;

  SELECT NOT EXISTS(SELECT 1 FROM public.user_roles WHERE role='admin') INTO _first_admin;
  _status := CASE WHEN _first_admin THEN 'approved' ELSE 'pending' END;

  INSERT INTO public.profiles(id, email, full_name, status)
  VALUES (_uid, _email, COALESCE(_full_name,''), _status);

  IF _first_admin THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin');
  END IF;

  RETURN (SELECT row_to_json(p) FROM public.profiles p WHERE id = _uid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_profile(text) TO authenticated;

-- Admin: approve / reject / link to professional
CREATE OR REPLACE FUNCTION public.set_profile_status(_user_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.profiles SET status=_status, updated_at=now() WHERE id = _user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_profile_status(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_profile_to_professional(_user_id uuid, _professional_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() <> _user_id AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.profiles SET professional_id=_professional_id, updated_at=now() WHERE id = _user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.link_profile_to_professional(uuid,uuid) TO authenticated;
