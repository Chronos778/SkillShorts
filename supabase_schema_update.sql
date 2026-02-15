-- Add bio column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
    entity_id TEXT, -- ID of the video or comment involved
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Anyone can insert notifications (triggered by backend logic usually, but for now allow authenticated)
CREATE POLICY "Authenticated users can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
