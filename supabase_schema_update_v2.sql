-- Add profile customization columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;
