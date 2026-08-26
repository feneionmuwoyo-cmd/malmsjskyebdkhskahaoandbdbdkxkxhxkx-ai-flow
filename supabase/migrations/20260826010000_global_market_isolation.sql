-- Global portal migration. Apply this only to the dedicated Global Supabase project.
-- The Angola project must keep its own URL, migrations, and credentials.

do $$ begin
  create type public.market_code as enum ('angola', 'global');
exception when duplicate_object then null; end $$;

create or replace function public.current_market()
returns text
language sql stable security definer set search_path = public as $$
  select case
    when coalesce(auth.jwt() -> 'user_metadata' ->> 'market', 'angola') = 'global'
      then 'global'
    else 'angola'
  end
$$;

-- This project already contains the Angola data. Existing and unspecified rows stay Angola.
create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  source text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
alter table public.ai_documents enable row level security;

alter table public.profiles add column if not exists market text not null default 'angola';
alter table public.instances add column if not exists market text not null default 'angola';
alter table public.whatsapp_contacts add column if not exists market text not null default 'angola';
alter table public.blocked_contacts add column if not exists market text not null default 'angola';
alter table public.messages add column if not exists market text not null default 'angola';
alter table public.stores add column if not exists market text not null default 'angola';
alter table public.products add column if not exists market text not null default 'angola';
alter table public.product_images add column if not exists market text not null default 'angola';
alter table public.store_orders add column if not exists market text not null default 'angola';
alter table public.appointments add column if not exists market text not null default 'angola';
alter table public.notifications add column if not exists market text not null default 'angola';
alter table public.message_queue add column if not exists market text not null default 'angola';
alter table public.ai_documents add column if not exists market text not null default 'angola';
alter table public.human_transfer_requests add column if not exists market text not null default 'angola';
alter table public.user_roles add column if not exists market text not null default 'angola';

create index if not exists idx_profiles_market_user on public.profiles(market, user_id);
create index if not exists idx_instances_market_user on public.instances(market, user_id);
create index if not exists idx_messages_market_user_created on public.messages(market, user_id, created_at desc);
create index if not exists idx_contacts_market_user on public.whatsapp_contacts(market, user_id);
create index if not exists idx_orders_market_user on public.store_orders(market, user_id);

create table if not exists public.inbox_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_number text not null,
  ai_enabled boolean not null default true,
  assigned_to uuid references auth.users(id) on delete set null,
  unread_count integer not null default 0,
  market text not null default 'global',
  updated_at timestamptz not null default now(),
  unique (user_id, phone_number, market)
);
alter table public.inbox_conversations enable row level security;
create policy global_inbox_conversations on public.inbox_conversations as restrictive for all to authenticated using (market = public.current_market() and user_id = auth.uid()) with check (market = public.current_market() and user_id = auth.uid());
alter publication supabase_realtime add table public.messages, public.whatsapp_contacts, public.inbox_conversations;

-- New auth-created profiles always inherit the Global portal market.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, phone, full_name, market)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'market' = 'global' then 'global' else 'angola' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- This policy layer is additive and keeps user ownership plus market isolation.
do $policy$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'instances', 'whatsapp_contacts', 'blocked_contacts', 'messages',
    'stores', 'products', 'product_images', 'store_orders', 'appointments',
    'notifications', 'message_queue', 'ai_documents', 'human_transfer_requests', 'user_roles'
  ] loop
    execute format('drop policy if exists global_market_isolation on public.%I', table_name);
    execute format(
      'create policy global_market_isolation on public.%I as restrictive for all to authenticated using (market::text = public.current_market()) with check (market::text = public.current_market())',
      table_name
    );
  end loop;
end
$policy$;

create table if not exists public.global_plans (
  id text primary key,
  name text not null,
  monthly_price_usd numeric(10,2) not null,
  included_messages integer,
  max_instances integer not null,
  max_seats integer,
  features jsonb not null default '[]'::jsonb,
  market text not null default 'global',
  active boolean not null default true
);

insert into public.global_plans (id, name, monthly_price_usd, included_messages, max_instances, max_seats, features)
values
  ('starter', 'Starter', 29, 1500, 1, 1, '["Basic custom AI", "Basic online store", "Email support"]'),
  ('pro', 'Pro', 79, 6000, 1, 3, '["Advanced AI", "Knowledge base and OCR", "Shared Inbox", "Shopify/WooCommerce"]'),
  ('scale', 'Scale / Enterprise', 199, null, 3, 10, '["Fair-use unlimited messages", "Advanced OCR", "Unlimited integrations", "Priority support"]')
on conflict (id) do update set
  name = excluded.name,
  monthly_price_usd = excluded.monthly_price_usd,
  included_messages = excluded.included_messages,
  max_instances = excluded.max_instances,
  max_seats = excluded.max_seats,
  features = excluded.features;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.global_plans(id),
  provider text not null check (provider in ('stripe', 'payoneer')),
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '3 days'),
  current_period_end timestamptz,
  market text not null default 'global',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, market)
);
alter table public.global_plans enable row level security;
alter table public.subscriptions enable row level security;
create policy global_plans_read on public.global_plans for select to authenticated using (market = public.current_market() and active);
create policy global_subscriptions on public.subscriptions as restrictive for all to authenticated using (market = public.current_market() and user_id = auth.uid()) with check (market = public.current_market() and user_id = auth.uid());

comment on table public.subscriptions is 'Global subscriptions; payment secrets belong in Supabase Edge Function secrets.';
