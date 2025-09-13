-- Add missing fields to games table for complete wizard data storage

-- Add fields from Step 1 (Basic Information)
ALTER TABLE public.games 
ADD COLUMN has_specific_times BOOLEAN DEFAULT false,
ADD COLUMN start_time TEXT,
ADD COLUMN end_time TEXT,
ADD COLUMN color_theme TEXT DEFAULT 'default',
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;

-- Add fields from Step 2 (Organization)  
ALTER TABLE public.games
ADD COLUMN organizer_name TEXT,
ADD COLUMN organizer_company TEXT,
ADD COLUMN event_website TEXT;

-- Add fields from Step 3 (Template & Terminology)
ALTER TABLE public.games
ADD COLUMN template_id TEXT,
ADD COLUMN asset_singular TEXT,
ADD COLUMN asset_plural TEXT;

-- Add fields from Step 4 (Game Settings)
ALTER TABLE public.games
ADD COLUMN enable_primary_market BOOLEAN DEFAULT true,
ADD COLUMN trading_mode TEXT DEFAULT 'continuous',
ADD COLUMN judges_panel BOOLEAN DEFAULT false;

-- Create table for team members (Step 2)
CREATE TABLE public.game_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on game_team_members
ALTER TABLE public.game_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policy for game_team_members - only game owners can manage
CREATE POLICY "Game owners can manage team members"
ON public.game_team_members
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.games 
        WHERE games.id = game_team_members.game_id 
        AND games.owner_user_id = auth.uid()
    )
);

-- Add index for better performance
CREATE INDEX idx_game_team_members_game_id ON public.game_team_members(game_id);