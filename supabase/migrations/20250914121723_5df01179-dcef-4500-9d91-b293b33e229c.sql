-- Create admin functions to bypass RLS for the specific admin user
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid()::text IN (
    SELECT id::text FROM auth.users WHERE email = 'joseafonsosantos@gmail.com'
  );
$$;

-- Create function to get all users for admin
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT u.id, u.first_name, u.last_name, u.email, u.created_at
  FROM public.users u
  WHERE public.is_super_admin();
$$;

-- Create function to get all startups for admin
CREATE OR REPLACE FUNCTION public.get_all_startups_admin()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  logo_url text,
  created_at timestamp with time zone,
  game_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT s.id, s.name, s.slug, s.logo_url, s.created_at, s.game_id
  FROM public.startups s
  WHERE public.is_super_admin();
$$;

-- Create function to delete users as admin
CREATE OR REPLACE FUNCTION public.admin_delete_users(user_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Delete participants first (to avoid foreign key constraints)
  DELETE FROM public.participants WHERE user_id = ANY(user_ids);
  
  -- Delete founder_members
  DELETE FROM public.founder_members 
  WHERE participant_id IN (
    SELECT p.id FROM public.participants p WHERE p.user_id = ANY(user_ids)
  );

  -- Delete users
  DELETE FROM public.users WHERE id = ANY(user_ids);

  RETURN json_build_object('success', true, 'deleted_count', array_length(user_ids, 1));
END;
$$;

-- Create function to delete startups as admin
CREATE OR REPLACE FUNCTION public.admin_delete_startups(startup_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Delete related records first (to avoid foreign key constraints)
  DELETE FROM public.founder_members WHERE startup_id = ANY(startup_ids);
  DELETE FROM public.positions WHERE startup_id = ANY(startup_ids);
  DELETE FROM public.trades WHERE startup_id = ANY(startup_ids);
  DELETE FROM public.orders_primary WHERE startup_id = ANY(startup_ids);

  -- Delete startups
  DELETE FROM public.startups WHERE id = ANY(startup_ids);

  RETURN json_build_object('success', true, 'deleted_count', array_length(startup_ids, 1));
END;
$$;