-- Founder admin: grant unlimited access to the owner's email, durably.
-- (1) update the profile if it already exists; (2) make signup auto-grant admin
-- for this email so it survives re-creation. Hardcoded server-side = not
-- client-escalatable (only whoever controls that Google account gets it).

update public.profiles
  set is_admin = true, plan = 'admin'
  where lower(email) = 'salinatomass53@gmail.com';

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_admin boolean := lower(new.email) = 'salinatomass53@gmail.com';
begin
  insert into public.profiles (id, email, name, avatar_url, is_admin, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_admin,
    case when v_admin then 'admin'::plan_type else 'hacker'::plan_type end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
