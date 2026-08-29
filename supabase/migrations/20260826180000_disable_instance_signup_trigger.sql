-- Instance records are created and maintained exclusively by the Evolution Edge Function.
-- Do not remove existing instance rows; only disable the legacy signup automation.
drop trigger if exists on_auth_user_created_instance on auth.users;
drop trigger if exists create_instance_on_signup_trigger on auth.users;
drop trigger if exists create_instance_for_new_user_trigger on auth.users;
drop function if exists public.create_instance_on_signup();
drop function if exists public.create_instance_for_new_user();
