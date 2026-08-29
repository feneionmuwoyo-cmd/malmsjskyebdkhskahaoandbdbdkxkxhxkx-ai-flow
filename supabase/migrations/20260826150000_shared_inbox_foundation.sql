-- Shared Inbox foundation. Extends the existing inbox_conversations/messages model.

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
  )
$$;

create or replace function public.has_workspace_permission(
  p_workspace_id uuid,
  p_permission text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = p_user_id
      and (role in ('owner', 'admin', 'manager') or permissions @> to_jsonb(array['*']::text[]) or permissions @> to_jsonb(array[p_permission]::text[]))
  )
$$;

alter table public.inbox_conversations
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists contact_id uuid references public.whatsapp_contacts(id) on delete set null,
  add column if not exists whatsapp_instance_name text,
  add column if not exists assigned_user_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_team_id uuid,
  add column if not exists status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  add column if not exists mode text not null default 'ai' check (mode in ('ai', 'human')),
  add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text,
  add column if not exists last_message_direction text check (last_message_direction in ('inbound', 'outbound')),
  add column if not exists last_message_id uuid,
  add column if not exists closed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

update public.inbox_conversations c
set workspace_id = p.workspace_id,
    assigned_user_id = coalesce(c.assigned_user_id, c.assigned_to),
    mode = case when c.ai_enabled then 'ai' else 'human' end,
    last_message_at = coalesce(c.last_message_at, c.updated_at)
from public.profiles p
where p.user_id = c.user_id and c.workspace_id is null;

insert into public.inbox_conversations (user_id, workspace_id, phone_number, whatsapp_instance_name, contact_id, last_message_at, last_message_preview, last_message_direction, market)
select c.user_id, c.workspace_id, c.phone_number, c.instance_name, c.id, c.last_message_at, null, null, coalesce(c.market, 'global')
from public.whatsapp_contacts c
where c.workspace_id is not null
on conflict (user_id, phone_number, market) do update
set workspace_id = excluded.workspace_id,
    contact_id = coalesce(public.inbox_conversations.contact_id, excluded.contact_id),
    whatsapp_instance_name = coalesce(public.inbox_conversations.whatsapp_instance_name, excluded.whatsapp_instance_name);

alter table public.messages add column if not exists conversation_id uuid references public.inbox_conversations(id) on delete set null;
alter table public.messages add column if not exists sender_type text not null default 'customer' check (sender_type in ('customer', 'ai', 'user', 'system'));
alter table public.messages add column if not exists sender_user_id uuid references auth.users(id) on delete set null;
alter table public.messages add column if not exists message_type text;
alter table public.messages add column if not exists status text not null default 'sent' check (status in ('pending', 'sent', 'delivered', 'read', 'failed'));
alter table public.messages add column if not exists sent_at timestamptz;
alter table public.messages add column if not exists delivered_at timestamptz;
alter table public.messages add column if not exists read_at timestamptz;

update public.messages m
set conversation_id = c.id,
    sent_at = coalesce(m.created_at, now()),
    message_type = coalesce(m.message_type, m.kind::text),
    sender_type = case when m.direction = 'inbound' then 'customer' when m.ai_responded then 'ai' else 'user' end
from public.inbox_conversations c
where c.user_id = m.user_id and c.phone_number = m.phone_number and m.conversation_id is null;

update public.inbox_conversations c
set last_message_at = (select m.created_at from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    last_message_preview = (select left(m.message_text, 240) from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    last_message_direction = (select m.direction::text from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    last_message_id = (select m.id from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1);

alter table public.inbox_conversations add constraint inbox_conversations_last_message_fk
  foreign key (last_message_id) references public.messages(id) on delete set null;

delete from public.messages duplicate
using public.messages original
where duplicate.whatsapp_instance_id is not null
  and duplicate.external_id is not null
  and duplicate.whatsapp_instance_id = original.whatsapp_instance_id
  and duplicate.external_id = original.external_id
  and (duplicate.created_at > original.created_at or (duplicate.created_at = original.created_at and duplicate.id > original.id));

create unique index if not exists messages_instance_external_unique
  on public.messages (whatsapp_instance_id, external_id)
  where external_id is not null;
create index if not exists inbox_conversations_workspace_list
  on public.inbox_conversations (workspace_id, status, last_message_at desc);
create index if not exists inbox_conversations_workspace_assignee
  on public.inbox_conversations (workspace_id, assigned_user_id, last_message_at desc);
create index if not exists inbox_conversations_workspace_mode
  on public.inbox_conversations (workspace_id, mode);
create index if not exists messages_conversation_created
  on public.messages (conversation_id, created_at desc);
create index if not exists messages_workspace_created
  on public.messages (workspace_id, created_at desc);

create table if not exists public.conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.conversation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('user', 'ai', 'system')),
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_reads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_message_id uuid references public.messages(id) on delete set null,
  last_read_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create index if not exists conversation_assignments_active_idx on public.conversation_assignments (conversation_id, unassigned_at) where unassigned_at is null;
create index if not exists conversation_notes_conversation_idx on public.conversation_notes (conversation_id, created_at desc);
create index if not exists conversation_events_conversation_idx on public.conversation_events (conversation_id, created_at desc);

alter table public.conversation_assignments enable row level security;
alter table public.conversation_notes enable row level security;
alter table public.conversation_events enable row level security;
alter table public.conversation_reads enable row level security;

drop policy if exists global_inbox_conversations on public.inbox_conversations;

do $policies$
declare table_name text;
begin
  foreach table_name in array array['inbox_conversations', 'messages', 'conversation_assignments', 'conversation_notes', 'conversation_events', 'conversation_reads'] loop
    execute format('drop policy if exists shared_inbox_workspace_access on public.%I', table_name);
    execute format('create policy shared_inbox_workspace_access on public.%I for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', table_name);
  end loop;
end
$policies$;

do $realtime$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inbox_conversations') then
    alter publication supabase_realtime add table public.inbox_conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_events') then
    alter publication supabase_realtime add table public.conversation_events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_notes') then
    alter publication supabase_realtime add table public.conversation_notes;
  end if;
end
$realtime$;

-- Subscription catalog and custom workspace entitlements.
alter table public.global_plans add column if not exists description text;
alter table public.global_plans add column if not exists entitlement_defaults jsonb not null default '{}'::jsonb;
alter table public.subscriptions add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.global_plans alter column monthly_price_usd drop not null;

create table if not exists public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entitlement_key text not null,
  value jsonb not null,
  source text not null default 'plan' check (source in ('plan', 'custom', 'addon')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, entitlement_key)
);

create index if not exists subscription_entitlements_workspace_idx on public.subscription_entitlements (workspace_id, entitlement_key);
alter table public.subscription_entitlements enable row level security;
create policy subscription_entitlements_workspace_access on public.subscription_entitlements
  for select to authenticated using (public.is_workspace_member(workspace_id));

insert into public.global_plans (id, name, monthly_price_usd, included_messages, max_instances, max_seats, features, description, entitlement_defaults)
values
  ('starter', 'Starter', 29, null, 1, 1, '["AI conversations", "Muwoyo Inbox", "Contacts", "Basic analytics"]', 'Para pequenos negócios que estão começando com automação WhatsApp.', '{"shared_inbox_enabled":true,"human_handoff_enabled":false,"max_team_members":1,"max_whatsapp_numbers":1,"max_ai_agents":1}'),
  ('growth', 'Growth', 59, null, 1, 3, '["Shared Inbox", "Human handoff", "Assignment", "Pipeline", "Advanced analytics"]', 'Para negócios em crescimento com colaboração de equipe.', '{"shared_inbox_enabled":true,"human_handoff_enabled":true,"max_team_members":3,"max_whatsapp_numbers":1,"max_ai_agents":1}'),
  ('pro', 'Pro', 99, null, 3, 10, '["Advanced Inbox", "Advanced permissions", "API", "Webhooks"]', 'Para operações maiores e fluxos avançados.', '{"shared_inbox_enabled":true,"human_handoff_enabled":true,"max_team_members":10,"max_whatsapp_numbers":3,"max_ai_agents":null}'),
  ('corporation', 'Corporation', null, null, 0, null, '["Custom limits", "Custom workflows", "Priority support"]', 'Solução personalizada para organizações com requisitos avançados.', '{"shared_inbox_enabled":true,"human_handoff_enabled":true}')
on conflict (id) do update set name = excluded.name, monthly_price_usd = excluded.monthly_price_usd, max_instances = excluded.max_instances, max_seats = excluded.max_seats, features = excluded.features, description = excluded.description, entitlement_defaults = excluded.entitlement_defaults;

alter table public.global_plans enable row level security;
