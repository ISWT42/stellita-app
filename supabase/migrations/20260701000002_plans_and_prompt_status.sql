-- Credit tiers (prompts per day). first_day_limit applies only on the signup
-- day; daily_limit every day after. -1 = unlimited.
--   hacker  : 30 first day, 20/day after
--   builder : 100/day (first day too)
--   studio  : 500/day
--   admin   : unlimited
update plans set first_day_limit = 30,  daily_limit = 20  where name = 'hacker';
insert into plans (name, first_day_limit, daily_limit)
  values ('builder', 100, 100)
  on conflict (name) do update set first_day_limit = 100, daily_limit = 100;
update plans set first_day_limit = 500, daily_limit = 500 where name = 'studio';
update plans set first_day_limit = -1,  daily_limit = -1  where name = 'admin';

-- Read-only credit status for the CURRENT user. NEVER consumes a credit. Uses
-- auth.uid() internally and takes no arguments, so a caller can only ever read
-- their OWN status — there is no id parameter to tamper with. Mirrors the exact
-- cap logic of consume_prompt (admin unlimited, first-day vs daily, overrides).
create or replace function prompt_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
  cap  int;
  used int;
  is_first_day boolean;
begin
  select * into prof from profiles where id = auth.uid();
  if not found then
    return jsonb_build_object('plan', null, 'used', 0, 'limit', 0, 'remaining', 0, 'unlimited', false);
  end if;

  if prof.is_admin then
    return jsonb_build_object('plan', prof.plan, 'used', 0, 'limit', -1, 'remaining', -1, 'unlimited', true);
  end if;

  -- Counter resets when the day rolls over (consume_prompt does the real reset).
  used := case when prof.prompts_day is distinct from current_date then 0 else prof.prompts_today end;

  is_first_day := (prof.created_at::date = current_date);
  if is_first_day then
    cap := coalesce(prof.first_day_limit_override, (select first_day_limit from plans where name = prof.plan));
  else
    cap := coalesce(prof.daily_limit_override, (select daily_limit from plans where name = prof.plan));
  end if;

  if cap < 0 then
    return jsonb_build_object('plan', prof.plan, 'used', used, 'limit', -1, 'remaining', -1, 'unlimited', true);
  end if;

  return jsonb_build_object(
    'plan', prof.plan,
    'used', used,
    'limit', cap,
    'remaining', greatest(cap - used, 0),
    'unlimited', false
  );
end;
$$;
grant execute on function prompt_status() to authenticated;

-- Per-day usage history for the CURRENT user (last p_days days, newest first).
-- Also auth.uid()-scoped: never exposes another user's activity.
create or replace function usage_daily(p_days int default 30)
  returns table(day date, count bigint)
language sql security definer set search_path = public as $$
  select created_at::date as day, count(*)::bigint as count
  from usage_events
  where user_id = auth.uid()
    and created_at >= current_date - greatest(p_days - 1, 0)
  group by created_at::date
  order by day desc;
$$;
grant execute on function usage_daily(int) to authenticated;
