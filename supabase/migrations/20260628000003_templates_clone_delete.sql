-- Templates, unique project names, and a smarter clone.
--
-- Model: a "template" is a normal project flagged is_template, owned by a system
-- account (info@xlmcode.dev). Templates are publicly readable by any logged-in
-- user (read-only) so the badges can show them; writing requires cloning. Clone
-- copies content (files + versions + messages), never contracts, and dedups the
-- name per owner: "<name> (Clone)", then "(Clone 1)", "(Clone 2)"...

-- ── 1. New columns ───────────────────────────────────────────────────────────
alter table projects add column if not exists is_template boolean not null default false;
alter table projects add column if not exists kind        text;   -- 'token'|'nft'|'swap'|... (templates only)
alter table projects add column if not exists published   boolean not null default false;

create index if not exists projects_template_idx on projects(is_template) where is_template;

-- ── 2. Unique project name per owner ─────────────────────────────────────────
-- Data was wiped before this migration, so no existing rows can violate it.
alter table projects add constraint projects_owner_name_key unique (owner_id, name);

-- ── 3. RLS — templates are public read-only for any authenticated user ───────
-- These are additive (OR'd) with the existing owner-scoped policies. The owner
-- policies still gate INSERT/UPDATE/DELETE, so non-owners can only READ templates.
create policy projects_select_templates on projects
  for select to authenticated using (is_template = true);

create policy versions_select_templates on project_versions
  for select to authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_template));

create policy messages_select_templates on messages
  for select to authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_template));

create policy contracts_select_templates on deployed_contracts
  for select to authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_template));

-- ── 4. clone_project — name dedup, unique slug, allow cloning templates ──────
create or replace function clone_project(p_source uuid, p_share_token text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  src       projects%rowtype;
  new_id    uuid;
  allowed   boolean;
  candidate text;
  new_slug  text;
  i         int := 0;
begin
  select * into src from projects where id = p_source;
  if not found then raise exception 'source not found'; end if;

  -- Allowed if: you own it, OR it is a public template, OR a valid share token.
  allowed := (src.owner_id = (select auth.uid()))
    or src.is_template
    or (p_share_token is not null and exists (
          select 1 from project_shares where project_id = p_source and token = p_share_token));
  if not allowed then raise exception 'not allowed'; end if;

  -- Unique name per owner: "<name> (Clone)", then "(Clone 1)", "(Clone 2)"...
  candidate := src.name || ' (Clone)';
  while exists (select 1 from projects where owner_id = (select auth.uid()) and name = candidate) loop
    i := i + 1;
    candidate := src.name || ' (Clone ' || i || ')';
  end loop;

  -- Unique slug (routing key) — random suffix so clones never collide.
  new_slug := left(src.slug, 40) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into projects (owner_id, slug, name, current_files, is_template, kind, published)
    values ((select auth.uid()), new_slug, candidate, src.current_files, false, null, false)
    returning id into new_id;

  insert into project_versions (project_id, seq, label, summary, files, created_at)
    select new_id, seq, label, summary, files, created_at
    from project_versions where project_id = p_source;

  insert into messages (project_id, seq, role, content, files, stats, actions, actions_done, kind, model_type, prompt_tokens, completion_tokens, cost_usd, created_at)
    select new_id, seq, role, content, files, stats, actions, actions_done, kind, model_type, 0, 0, 0, created_at
    from messages where project_id = p_source;

  return new_id;
end;
$$;
