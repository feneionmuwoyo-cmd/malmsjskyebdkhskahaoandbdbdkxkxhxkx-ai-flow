-- Reset script for the current Supabase project before connecting to a new database.
-- Run this in the Supabase SQL editor only if you want to remove the Muwoyo Internacional schema additions.
-- This script removes custom tables, triggers, policies, and helper functions.

BEGIN;

DROP TRIGGER IF EXISTS trg_instances_updated ON public.instances;
DROP TRIGGER IF EXISTS trg_message_queue_updated ON public.message_queue;
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS trg_user_roles_updated ON public.user_roles;
DROP TRIGGER IF EXISTS trg_inbox_conversations_updated ON public.inbox_conversations;
DROP TRIGGER IF EXISTS trg_whatsapp_contacts_updated ON public.whatsapp_contacts;
DROP TRIGGER IF EXISTS trg_blocked_contacts_updated ON public.blocked_contacts;

DROP TABLE IF EXISTS public.instances CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS public.blocked_contacts CASCADE;
DROP TABLE IF EXISTS public.inbox_conversations CASCADE;
DROP TABLE IF EXISTS public.message_queue CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.human_transfers CASCADE;
DROP TABLE IF EXISTS public.web_push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.account_notifications CASCADE;
DROP TABLE IF EXISTS public.credit_entitlements CASCADE;
DROP TABLE IF EXISTS public.email_verifications CASCADE;
DROP TABLE IF EXISTS public.password_reset_otps CASCADE;
DROP TABLE IF EXISTS public.tutorial_videos CASCADE;
DROP TABLE IF EXISTS public.tutorial_media CASCADE;
DROP TABLE IF EXISTS public.ai_documents CASCADE;
DROP TABLE IF EXISTS public.ai_usage_logs CASCADE;
DROP TABLE IF EXISTS public.commercial_activations CASCADE;
DROP TABLE IF EXISTS public.commercial_queue CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.carts CASCADE;

DROP FUNCTION IF EXISTS public.tg_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_subadmin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_market_admin(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.is_market_member(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_market_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.recalc_ai_balance() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_market() CASCADE;
DROP FUNCTION IF EXISTS public.reconcile_market_access() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_trial_credit_count() CASCADE;
DROP FUNCTION IF EXISTS public.sync_trial_scope() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own inbox" ON public.inbox_conversations;
DROP POLICY IF EXISTS "Users can manage inbox" ON public.inbox_conversations;
DROP POLICY IF EXISTS "Users can manage their contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Users can manage their blocked contacts" ON public.blocked_contacts;
DROP POLICY IF EXISTS "Users can manage their instances" ON public.instances;
DROP POLICY IF EXISTS "Users can update their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can access own products" ON public.products;
DROP POLICY IF EXISTS "Users can access own stores" ON public.stores;

COMMIT;

-- Optional: if you want a fully blank schema, uncomment the next two lines.
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
