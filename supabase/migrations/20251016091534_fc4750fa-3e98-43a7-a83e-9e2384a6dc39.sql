-- Ensure trigger to populate profiles, owner role, and default company on new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill roles for existing users who should be owners
-- 1) Users who are already owners in company_members
INSERT INTO public.user_roles (user_id, role)
SELECT cm.user_id, 'owner'::app_role
FROM public.company_members cm
LEFT JOIN public.user_roles ur ON ur.user_id = cm.user_id
WHERE ur.user_id IS NULL AND cm.role = 'owner'::app_role
ON CONFLICT DO NOTHING;

-- 2) Users who created a company but have no role yet
INSERT INTO public.user_roles (user_id, role)
SELECT c.created_by, 'owner'::app_role
FROM public.companies c
LEFT JOIN public.user_roles ur ON ur.user_id = c.created_by
WHERE ur.user_id IS NULL
ON CONFLICT DO NOTHING;