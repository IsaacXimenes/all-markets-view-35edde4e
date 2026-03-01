
-- Fix: restrict INSERT to only the trigger (SECURITY DEFINER runs as superuser, bypasses RLS)
-- So we can safely remove the permissive INSERT policy
DROP POLICY "Service role can insert profiles" ON public.profiles;
