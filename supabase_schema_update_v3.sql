-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for Follows
-- Anyone can view follows (to see counts and lists)
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" 
ON public.follows FOR SELECT 
USING (true);

-- Authenticated users can follow others
DROP POLICY IF EXISTS "Authenticated users can insert follows" ON public.follows;
CREATE POLICY "Authenticated users can insert follows" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follow record)
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);
