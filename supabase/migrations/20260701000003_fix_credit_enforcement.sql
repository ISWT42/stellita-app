-- Fix credit enforcement.
--
-- Bug: consume_prompt() is SECURITY DEFINER and updates profiles.prompts_today /
-- prompts_day. SECURITY DEFINER does NOT change auth.uid() (that comes from the
-- request JWT), so inside consume_prompt auth.uid() is the real caller — and the
-- guard_profile_privileges trigger raises whenever a non-null auth.uid() changes
-- those columns. Result: consume_prompt raised for every non-admin user, so chat
-- returned 500 instead of enforcing the limit (admins short-circuit before the
-- update, which masked it).
--
-- Fix: consume_prompt signals the trigger through a transaction-local GUC that
-- clients CANNOT set via PostgREST (no raw SET/RPC surface for it). The guard
-- still blocks any direct client UPDATE to the privileged columns — the only way
-- to write prompts_today/prompts_day is through this audited function.

create or replace function guard_profile_privileges() returns trigger
language plpgsql as $$
begin
  -- Trusted counter write from consume_prompt() — allow it through.
  if current_setting('xlmcode.allow_counter_update', true) = 'on' then
    return new;
  end if;
  if auth.uid() is not null and (
       new.is_admin                 is distinct from old.is_admin
    or new.plan                     is distinct from old.plan
    or new.first_day_limit_override is distinct from old.first_day_limit_override
    or new.daily_limit_override     is distinct from old.daily_limit_override
    or new.prompts_today            is distinct from old.prompts_today
    or new.prompts_day              is distinct from old.prompts_day
  ) then
    raise exception 'not allowed to modify privileged profile fields';
  end if;
  return new;
end;
$$;

create or replace function consume_prompt(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  prof   profiles%rowtype;
  cap    int;
  is_first_day boolean;
begin
  select * into prof from profiles where id = p_user for update;
  if not found then return false; end if;
  if prof.is_admin then return true; end if;

  -- Authorize this function's own writes to the guarded counter columns for the
  -- rest of this transaction only (local). No client can set this GUC.
  perform set_config('xlmcode.allow_counter_update', 'on', true);

  -- reset the daily counter when the day rolls over
  if prof.prompts_day is distinct from current_date then
    update profiles set prompts_today = 0, prompts_day = current_date where id = p_user;
    prof.prompts_today := 0;
  end if;

  is_first_day := (prof.created_at::date = current_date);
  if is_first_day then
    cap := coalesce(prof.first_day_limit_override, (select first_day_limit from plans where name = prof.plan));
  else
    cap := coalesce(prof.daily_limit_override, (select daily_limit from plans where name = prof.plan));
  end if;

  if cap >= 0 and prof.prompts_today >= cap then
    return false;
  end if;

  update profiles set prompts_today = prompts_today + 1, prompts_day = current_date where id = p_user;
  return true;
end;
$$;
