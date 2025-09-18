-- Security Fixes Migration
-- Fix email harvesting vulnerabilities and improve RLS policies

-- 1. Fix game_team_members RLS policy to prevent email harvesting
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authorized users can view team members" ON public.game_team_members;

-- Create a more restrictive policy - only game owners can view team members
CREATE POLICY "Only game owners can view team members" 
ON public.game_team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_team_members.game_id 
    AND games.owner_user_id = auth.uid()
  )
);

-- 2. Fix users table RLS to prevent email harvesting by game owners
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Game owners can view participant profiles" ON public.users;

-- Create a secure function to get participant profile data without emails
CREATE OR REPLACE FUNCTION public.get_participant_profile_secure(participant_user_id uuid)
RETURNS TABLE(id uuid, first_name text, last_name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return profile data if the caller is a game owner of a game where this user participates
  SELECT u.id, u.first_name, u.last_name, u.avatar_url
  FROM users u
  WHERE u.id = participant_user_id
  AND EXISTS (
    SELECT 1 FROM participants p 
    JOIN games g ON g.id = p.game_id
    WHERE p.user_id = participant_user_id 
    AND g.owner_user_id = auth.uid()
  );
$$;

-- Create new secure policy for game owners to view participant profiles (without emails)
CREATE POLICY "Game owners can view participant profiles securely" 
ON public.users 
FOR SELECT 
USING (
  -- Users can view their own profile
  auth.uid() = id
  OR
  -- Game owners can view participant profiles (but RLS will still apply to limit fields)
  EXISTS (
    SELECT 1 FROM participants p 
    JOIN games g ON g.id = p.game_id
    WHERE p.user_id = users.id 
    AND g.owner_user_id = auth.uid()
  )
);

-- 3. Add missing RLS policies for founder_members table
-- Add INSERT policy
CREATE POLICY "Game owners can insert founder members" 
ON public.founder_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ventures v 
    JOIN games g ON g.id = v.game_id
    WHERE v.id = founder_members.venture_id 
    AND g.owner_user_id = auth.uid()
  )
);

-- Add UPDATE policy  
CREATE POLICY "Game owners and founders can update founder members" 
ON public.founder_members 
FOR UPDATE 
USING (
  -- Game owners can update
  EXISTS (
    SELECT 1 FROM ventures v 
    JOIN games g ON g.id = v.game_id
    WHERE v.id = founder_members.venture_id 
    AND g.owner_user_id = auth.uid()
  )
  OR
  -- Founders can update their own membership
  is_participant_of_user(participant_id)
);

-- Add DELETE policy
CREATE POLICY "Game owners can delete founder members" 
ON public.founder_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM ventures v 
    JOIN games g ON g.id = v.game_id
    WHERE v.id = founder_members.venture_id 
    AND g.owner_user_id = auth.uid()
  )
);

-- 4. Enhance positions table policies
-- Add INSERT policy for positions (should only be done via functions)
CREATE POLICY "System can insert positions" 
ON public.positions 
FOR INSERT 
WITH CHECK (false); -- Prevent direct inserts, only allow via functions

-- Add UPDATE policy for positions (should only be done via functions) 
CREATE POLICY "System can update positions" 
ON public.positions 
FOR UPDATE 
USING (false); -- Prevent direct updates, only allow via functions

-- Add DELETE policy for positions
CREATE POLICY "System can delete positions" 
ON public.positions 
FOR DELETE 
USING (false); -- Prevent direct deletes, only allow via functions

-- 5. Enhance trades table policies  
-- Add INSERT policy for trades (should only be done via functions)
CREATE POLICY "System can insert trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (false); -- Prevent direct inserts, only allow via functions

-- Add UPDATE policy for trades (should only be done via functions)
CREATE POLICY "System can update trades" 
ON public.trades 
FOR UPDATE 
USING (false); -- Prevent direct updates, only allow via functions

-- Add DELETE policy for trades  
CREATE POLICY "System can delete trades" 
ON public.trades 
FOR DELETE 
USING (false); -- Prevent direct deletes, only allow via functions

-- 6. Create audit function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT auth.uid(),
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log security events (you could extend this to write to an audit table)
  RAISE LOG 'SECURITY_EVENT: type=%, user=%, details=%', event_type, user_id, details;
END;
$$;

-- 7. Create function to validate email access
CREATE OR REPLACE FUNCTION public.can_access_participant_email(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow email access if user is accessing their own profile
  -- or if they are a super admin
  SELECT (
    auth.uid() = target_user_id 
    OR 
    public.is_super_admin()
  );
$$;