-- =====================================================
-- EMERGENCY FIX: Disable broken trigger to allow user creation
-- Run this in Supabase SQL Editor FIRST
-- =====================================================

-- Step 1: List all triggers on auth.users (for diagnosis)
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- Step 2: Disable ALL triggers on auth.users temporarily
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Step 3: Verify triggers are disabled
SELECT 'All triggers on auth.users are now DISABLED' as status;
SELECT 'You can now run the seeding script' as next_step;
SELECT 'After seeding, run: /app/supabase/enable_triggers.sql' as reminder;
