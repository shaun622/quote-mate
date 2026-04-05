-- Drop all QuoteMate tables (safe - they're empty).
-- Run before reapplying migrations.
drop table if exists public.job_photos cascade;
drop table if exists public.job_status_history cascade;
drop table if exists public.jobs cascade;
drop table if exists public.quote_items cascade;
drop table if exists public.quotes cascade;
drop table if exists public.pricing_items cascade;
drop table if exists public.businesses cascade;
drop function if exists public.current_business_id() cascade;
drop function if exists public.set_updated_at() cascade;
