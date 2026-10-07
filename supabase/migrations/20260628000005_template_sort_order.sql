-- Explicit, data-driven ordering for templates (badges) — not hardcoded in code.
alter table projects add column if not exists sort_order int not null default 0;
