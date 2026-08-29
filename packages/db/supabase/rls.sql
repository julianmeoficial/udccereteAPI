-- Row Level Security — Blog UDEC Cereté
-- Aplicar en Supabase después de migraciones Drizzle.
-- La API valida JWT; RLS es la segunda línea de defensa.

-- Helper: rol del usuario autenticado desde JWT app_metadata
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'visitor'
  );
$$;

CREATE OR REPLACE FUNCTION public.jwt_center_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'center_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.jwt_program_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      auth.jwt() -> 'app_metadata' ->> 'program_id',
      (SELECT program_id::text FROM public.profiles WHERE id = auth.uid())
    ),
    ''
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('super_admin', 'admin', 'editor', 'teacher');
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('super_admin', 'admin', 'editor');
$$;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.jwt_role() = 'super_admin');

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL USING (public.jwt_role() = 'super_admin');

-- posts: lectura pública de publicados (RN-001)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_select_published ON public.posts
  FOR SELECT USING (
    status = 'published'
    OR author_id = auth.uid()
    OR public.is_moderator()
  );

CREATE POLICY posts_write_staff ON public.posts
  FOR INSERT WITH CHECK (public.is_moderator());

CREATE POLICY posts_update_staff ON public.posts
  FOR UPDATE USING (public.is_moderator() OR author_id = auth.uid());

-- comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_select ON public.comments
  FOR SELECT USING (
    moderation_status = 'approved'
    OR author_id = auth.uid()
    OR public.is_moderator()
  );

CREATE POLICY comments_insert_auth ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY comments_moderate ON public.comments
  FOR UPDATE USING (public.is_moderator());

-- resources: alcance por programa (RN-005)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY resources_select ON public.resources
  FOR SELECT USING (
    scope = 'institutional'
    OR (scope = 'program' AND program_id = public.jwt_program_id())
    OR public.is_staff()
    OR (scope = 'internal' AND public.is_staff())
  );

CREATE POLICY resources_write ON public.resources
  FOR INSERT WITH CHECK (public.is_staff());

-- forum_opinions: solo aprobadas visibles; sin user_id en fila
ALTER TABLE public.forum_opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_select_approved ON public.forum_opinions
  FOR SELECT USING (moderation_status = 'approved' OR public.is_moderator());

CREATE POLICY forum_moderate ON public.forum_opinions
  FOR UPDATE USING (public.is_moderator());

-- calendar_activities: lectura pública
ALTER TABLE public.calendar_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_select ON public.calendar_activities
  FOR SELECT USING (true);

CREATE POLICY calendar_write ON public.calendar_activities
  FOR ALL USING (public.jwt_role() IN ('super_admin', 'admin', 'editor'));

-- wellbeing_routes: lectura pública (RN-007)
ALTER TABLE public.wellbeing_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY wellbeing_select ON public.wellbeing_routes
  FOR SELECT USING (true);

CREATE POLICY wellbeing_write ON public.wellbeing_routes
  FOR ALL USING (public.is_moderator());

-- notifications: solo propias
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own ON public.notifications
  FOR ALL USING (profile_id = auth.uid());

-- audit_log: solo super_admin
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_admin ON public.audit_log
  FOR SELECT USING (public.jwt_role() = 'super_admin');
