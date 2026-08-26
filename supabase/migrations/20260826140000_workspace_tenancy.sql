-- Phase 1: explicit workspace tenancy for the shared Angola/Global database.
-- Existing rows are backfilled into one workspace per profile owner.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'My workspace',
  market text not null default 'angola' check (market in ('angola', 'global')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'sales', 'support', 'member')),
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create or replace function public.is_market_privileged(p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role in ('admin', 'sub_admin')
  )
$$;

-- Admins and subadmins can operate from either portal; ordinary users cannot.
create or replace function public.current_market()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select market from public.profiles where user_id = auth.uid() limit 1),
    'angola'
  )
$$;

insert into public.workspaces (owner_user_id, name, market)
select p.user_id, coalesce(nullif(p.business_name, ''), 'Muwoyo workspace'), coalesce(p.market, 'angola')
from public.profiles p
on conflict (owner_user_id) do update set market = excluded.market;

alter table public.profiles add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
update public.profiles p set workspace_id = w.id
from public.workspaces w where w.owner_user_id = p.user_id and p.workspace_id is null;

insert into public.workspace_members (workspace_id, user_id, role, permissions)
select w.id, w.owner_user_id, 'owner', '["*"]'::jsonb
from public.workspaces w
on conflict (workspace_id, user_id) do nothing;

-- Add tenant keys to existing business resources, without creating duplicate concepts.
do $tables$
declare
  table_name text;
begin
  foreach table_name in array array[
    'instances', 'whatsapp_contacts', 'blocked_contacts', 'messages', 'stores',
    'products', 'store_orders', 'appointments', 'notifications', 'message_queue',
    'ai_documents', 'human_transfer_requests', 'credit_ledger', 'ai_usage_events',
    'user_ai_deposits', 'user_ai_balances'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade', table_name);
    end if;
  end loop;
end
$tables$;

update public.instances i set workspace_id = p.workspace_id from public.profiles p where p.user_id = i.user_id and i.workspace_id is null;
update public.whatsapp_contacts c set workspace_id = p.workspace_id from public.profiles p where p.user_id = c.user_id and c.workspace_id is null;
update public.blocked_contacts c set workspace_id = p.workspace_id from public.profiles p where p.user_id = c.user_id and c.workspace_id is null;
update public.messages m set workspace_id = p.workspace_id from public.profiles p where p.user_id = m.user_id and m.workspace_id is null;
update public.stores s set workspace_id = p.workspace_id from public.profiles p where p.user_id = s.user_id and s.workspace_id is null;
update public.products p set workspace_id = s.workspace_id from public.stores s where s.id = p.store_id and p.workspace_id is null;
update public.store_orders o set workspace_id = p.workspace_id from public.profiles p where p.user_id = o.user_id and o.workspace_id is null;
update public.appointments a set workspace_id = p.workspace_id from public.profiles p where p.user_id = a.user_id and a.workspace_id is null;
update public.notifications n set workspace_id = p.workspace_id from public.profiles p where p.user_id = n.user_id and n.workspace_id is null;
update public.message_queue q set workspace_id = p.workspace_id from public.profiles p where p.user_id = q.user_id and q.workspace_id is null;
update public.ai_documents d set workspace_id = p.workspace_id from public.profiles p where p.user_id = d.user_id and d.workspace_id is null;
update public.human_transfer_requests h set workspace_id = p.workspace_id from public.profiles p where p.user_id = h.user_id and h.workspace_id is null;

create index if not exists idx_workspace_members_user on public.workspace_members(user_id, workspace_id);
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id, role);
create index if not exists idx_profiles_workspace on public.profiles(workspace_id, market);
create index if not exists idx_messages_workspace_created on public.messages(workspace_id, created_at desc);
create index if not exists idx_instances_workspace on public.instances(workspace_id);
create index if not exists idx_contacts_workspace_phone on public.whatsapp_contacts(workspace_id, phone_number);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspace_member_access on public.workspaces;
create policy workspace_member_access on public.workspaces for all to authenticated
using (public.is_market_privileged(auth.uid()) or exists (
  select 1 from public.workspace_members m where m.workspace_id = workspaces.id and m.user_id = auth.uid()
))
with check (public.is_market_privileged(auth.uid()) or owner_user_id = auth.uid());

drop policy if exists workspace_members_access on public.workspace_members;
create policy workspace_members_access on public.workspace_members for all to authenticated
using (public.is_market_privileged(auth.uid()) or user_id = auth.uid() or exists (
  select 1 from public.workspace_members own where own.workspace_id = workspace_members.workspace_id and own.user_id = auth.uid() and own.role in ('owner', 'admin', 'manager')
))
with check (public.is_market_privileged(auth.uid()) or exists (
  select 1 from public.workspace_members own where own.workspace_id = workspace_members.workspace_id and own.user_id = auth.uid() and own.role in ('owner', 'admin', 'manager')
));

-- Replace the previous market-only restrictive layer with market OR privileged access.
do $policies$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'instances', 'whatsapp_contacts', 'blocked_contacts', 'messages',
    'stores', 'products', 'product_images', 'store_orders', 'appointments',
    'notifications', 'message_queue', 'ai_documents', 'human_transfer_requests', 'user_roles'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop policy if exists global_market_isolation on public.%I', table_name);
      execute format('create policy global_market_isolation on public.%I as restrictive for all to authenticated using (public.is_market_privileged(auth.uid()) or market::text = public.current_market()) with check (public.is_market_privileged(auth.uid()) or market::text = public.current_market())', table_name);
    end if;
  end loop;
end
$policies$;

-- Protect the tenant key from client-side reassignment.
create or replace function public.prevent_workspace_reassignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.workspace_id is not null and new.workspace_id is distinct from old.workspace_id and not public.is_market_privileged(auth.uid()) then
    raise exception 'workspace_id_is_server_managed';
  end if;
  return new;
end;
$$;

do $triggers$
declare
  table_name text;
begin
  foreach table_name in array array['profiles','instances','whatsapp_contacts','blocked_contacts','messages','stores','products','store_orders','appointments','notifications','message_queue','ai_documents','human_transfer_requests'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists trg_prevent_workspace_reassignment on public.%I', table_name);
      execute format('create trigger trg_prevent_workspace_reassignment before update on public.%I for each row execute function public.prevent_workspace_reassignment()', table_name);
    end if;
  end loop;
end
$triggers$;
