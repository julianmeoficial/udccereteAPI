-- Triggers de Supabase Auth → profiles
-- Aplicar DESPUÉS de las migraciones Drizzle y con auth.users existente.

-- FK opcional: descomentar cuando profiles.id referencie auth.users
-- ALTER TABLE public.profiles
--   ADD CONSTRAINT profiles_id_fkey
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role text;
BEGIN
  IF NEW.email ILIKE '%@unicartagena.edu.co' THEN
    default_role := 'student';
  ELSE
    default_role := 'visitor';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'role', default_role),
    COALESCE((NEW.email_confirmed_at IS NOT NULL), false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
