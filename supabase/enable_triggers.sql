-- =====================================================
-- Re-enable triggers after seeding is complete
-- Run this in Supabase SQL Editor AFTER seeding
-- =====================================================

-- Re-enable all triggers on auth.users
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- Verify triggers are enabled
SELECT 
    trigger_name, 
    event_manipulation,
    action_timing,
    'ENABLED' as status
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

SELECT 'Triggers re-enabled successfully!' as status;
