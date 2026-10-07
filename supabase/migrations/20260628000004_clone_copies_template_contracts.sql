-- Clone semantics for contracts:
--   * Cloning a TEAM TEMPLATE (is_template) → the contracts are SHARED singletons
--     (Soroswap router, demo token/NFT). Copy the rows verbatim so every clone
--     references the same on-chain contract.
--   * Cloning a USER's project (via share) → contracts are NOT copied here; the
--     backend clone endpoint re-deploys a fresh instance owned by the cloner and
--     rewrites the code. (Handled outside this RPC.)
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

  allowed := (src.owner_id = (select auth.uid()))
    or src.is_template
    or (p_share_token is not null and exists (
          select 1 from project_shares where project_id = p_source and token = p_share_token));
  if not allowed then raise exception 'not allowed'; end if;

  candidate := src.name || ' (Clone)';
  while exists (select 1 from projects where owner_id = (select auth.uid()) and name = candidate) loop
    i := i + 1;
    candidate := src.name || ' (Clone ' || i || ')';
  end loop;

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

  -- Shared team-template contracts travel with the clone; user-project contracts do not.
  if src.is_template then
    insert into deployed_contracts (project_id, manifest_id, name, category, contract_id, network, tx_hash, explorer_url, deployer, config, created_at)
      select new_id, manifest_id, name, category, contract_id, network, tx_hash, explorer_url, deployer, config, created_at
      from deployed_contracts where project_id = p_source;
  end if;

  return new_id;
end;
$$;
