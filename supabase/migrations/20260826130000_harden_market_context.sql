-- The market used by RLS is authoritative in profiles, not user-editable metadata.
create or replace function public.current_market()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select market from public.profiles where user_id = auth.uid() limit 1),
    'angola'
  )
$$;

-- Keep the trigger as the only onboarding boundary for portal assignment.
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
