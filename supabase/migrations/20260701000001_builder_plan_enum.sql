-- Add the 'builder' tier between 'hacker' and 'studio'. This MUST be its own
-- migration: Postgres forbids using a newly-added enum value in the same
-- transaction that adds it, and the next migration inserts a 'builder' plan row.
alter type plan_type add value if not exists 'builder' before 'studio';
