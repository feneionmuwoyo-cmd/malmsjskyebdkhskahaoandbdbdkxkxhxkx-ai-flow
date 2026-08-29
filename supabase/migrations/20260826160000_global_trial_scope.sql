-- Keep the shared database intact while limiting the 50-message trial to Angola.
create or replace function public.ensure_message_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger_id uuid;
begin
  if coalesce(new.market, 'angola') = 'angola' and new.account_status = 'trial' then
    insert into public.credit_ledger (user_id, amount, credit_type)
    values (new.user_id, 50, 'trial')
    on conflict do nothing
    returning id into ledger_id;
    if ledger_id is not null and new.message_limit < new.messages_received + 50 then
      new.message_limit := new.messages_received + 50;
    end if;
    new.free_messages_granted := true;
  elsif new.account_status = 'active' then
    insert into public.credit_ledger (user_id, amount, credit_type)
    values (new.user_id, 200, 'activation_bonus')
    on conflict do nothing
    returning id into ledger_id;
    if ledger_id is not null and new.message_limit < new.messages_received + 200 then
      new.message_limit := new.messages_received + 200;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.force_trial_message_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.market, 'angola') = 'angola' and new.account_status = 'trial' and new.trial_started_at is null then
    new.message_limit := 0;
    new.free_messages_granted := false;
  end if;
  return new;
end;
$$;

create or replace function public.start_trial_on_whatsapp_connection(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  ledger_id uuid;
  started_at timestamptz;
begin
  select * into profile_row from public.profiles where user_id = p_user_id for update;
  if profile_row.user_id is null then raise exception 'profile_not_found'; end if;

  if coalesce(profile_row.market, 'angola') <> 'angola' then
    return jsonb_build_object('ok', true, 'started', false, 'market', profile_row.market);
  end if;
  if profile_row.trial_started_at is not null then
    return jsonb_build_object('ok', true, 'started', false, 'expires_at', profile_row.trial_expires_at);
  end if;
  if profile_row.account_status <> 'trial' then
    return jsonb_build_object('ok', true, 'started', false, 'status', profile_row.account_status);
  end if;

  started_at := coalesce(profile_row.trial_started_at, now());
  insert into public.credit_ledger (user_id, amount, credit_type)
  values (p_user_id, 50, 'trial')
  on conflict do nothing
  returning id into ledger_id;

  update public.profiles
  set trial_started_at = started_at,
      trial_expires_at = started_at + interval '24 hours',
      message_limit = messages_received + 50,
      free_messages_granted = true
  where user_id = p_user_id;

  perform public.dispatch_email_once(
    'trial_start:' || p_user_id,
    p_user_id,
    'trial_start',
    jsonb_build_object(
      'to', jsonb_build_object('email', profile_row.email, 'name', coalesce(profile_row.full_name, profile_row.email)),
      'template_type', 'trial_start',
      'template_data', jsonb_build_object('name', coalesce(profile_row.full_name, profile_row.email), 'remaining', 50)
    )
  );
  insert into public.notifications (user_id, title, message, type, link)
  values (p_user_id, 'Período de teste iniciado', 'Você tem 24 horas e 50 mensagens gratuitas a partir da conexão do WhatsApp.', 'trial_start', '/dashboard');
  return jsonb_build_object('ok', true, 'started', ledger_id is not null, 'expires_at', started_at + interval '24 hours');
end;
$$;

revoke all on function public.start_trial_on_whatsapp_connection(uuid) from public, anon, authenticated;
grant execute on function public.start_trial_on_whatsapp_connection(uuid) to service_role;

create or replace function public.expire_trial_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  with expired as (
    update public.profiles
    set account_status = 'inactive'
    where coalesce(market, 'angola') = 'angola'
      and account_status = 'trial'
      and trial_expires_at is not null
      and trial_expires_at <= now()
    returning user_id
  )
  select count(*)::integer into expired_count from expired;

  update public.instances i
  set automation_paused = true,
      automation_paused_until = null
  where i.user_id in (
    select p.user_id from public.profiles p
    where coalesce(p.market, 'angola') = 'angola'
      and p.account_status = 'inactive'
      and p.trial_expires_at <= now()
  );

  insert into public.notifications (user_id, title, message, type, link)
  select p.user_id,
    'Período de teste terminado',
    'O seu teste terminou. Contacte o suporte para pagar o setup e continuar a utilizar a Muwoyo.',
    'trial_expired', '/recargas'
  from public.profiles p
  where coalesce(p.market, 'angola') = 'angola'
    and p.account_status = 'inactive'
    and p.trial_expires_at <= now()
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.user_id and n.type = 'trial_expired'
    );
  return coalesce(expired_count, 0);
end;
$$;

revoke all on function public.expire_trial_accounts() from public, anon, authenticated;
grant execute on function public.expire_trial_accounts() to service_role;
