-- QuoteMate initial schema
-- All tables use uuid PKs, timestamptz (UTC), and RLS.

create extension if not exists "pgcrypto";

-- =========================================================
-- businesses
-- =========================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  abn text,
  trade_type text not null,
  phone text not null,
  email text not null,
  address text,
  logo_url text,
  brand_color text not null default '#1E3A5F',
  stripe_customer_id text,
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial','active','cancelled','expired','past_due')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_user_id_idx on public.businesses(user_id);

-- =========================================================
-- pricing_items
-- =========================================================
create table public.pricing_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category text not null,
  unit text not null,
  default_price numeric(10,2) not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pricing_items_business_idx on public.pricing_items(business_id);
create index pricing_items_active_idx on public.pricing_items(business_id, is_active);

-- =========================================================
-- quotes
-- =========================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_number text not null,
  status text not null default 'draft'
    check (status in ('draft','sent','viewed','accepted','declined','expired')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  job_site_address text not null,
  scope_of_work text,
  exclusions text,
  validity_days integer not null default 30,
  valid_until date,
  estimated_start date,
  estimated_duration text,
  notes text,
  payment_terms text not null default '50% deposit, 50% on completion',
  subtotal numeric(10,2) not null default 0,
  gst numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  decline_reason text,
  public_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, quote_number)
);

create index quotes_business_idx on public.quotes(business_id);
create index quotes_status_idx on public.quotes(business_id, status);
create index quotes_public_token_idx on public.quotes(public_token);

-- =========================================================
-- quote_items
-- =========================================================
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  pricing_item_id uuid references public.pricing_items(id) on delete set null,
  name text not null,
  description text,
  category text not null,
  unit text not null,
  quantity numeric(10,2) not null,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index quote_items_quote_idx on public.quote_items(quote_id);

-- =========================================================
-- jobs
-- =========================================================
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid not null unique references public.quotes(id) on delete restrict,
  job_number text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled','in_progress','on_hold','completed','invoiced')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  job_site_address text not null,
  scheduled_start date,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, job_number)
);

create index jobs_business_idx on public.jobs(business_id);
create index jobs_status_idx on public.jobs(business_id, status);
create index jobs_scheduled_start_idx on public.jobs(business_id, scheduled_start);

-- =========================================================
-- job_status_history
-- =========================================================
create table public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now(),
  note text,
  notification_sent boolean not null default false
);

create index job_status_history_job_idx on public.job_status_history(job_id);

-- =========================================================
-- job_photos
-- =========================================================
create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  url text not null,
  caption text,
  photo_type text not null default 'other'
    check (photo_type in ('site_condition','progress','before','after','issue','other')),
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_photos_job_idx on public.job_photos(job_id);
create index job_photos_business_idx on public.job_photos(business_id);

-- =========================================================
-- Helpers
-- =========================================================

-- Return the business_id for the current authenticated user
create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.businesses where user_id = auth.uid() limit 1;
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_businesses_updated before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger trg_pricing_items_updated before update on public.pricing_items
  for each row execute function public.set_updated_at();
create trigger trg_quotes_updated before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger trg_job_photos_updated before update on public.job_photos
  for each row execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================
alter table public.businesses         enable row level security;
alter table public.pricing_items      enable row level security;
alter table public.quotes             enable row level security;
alter table public.quote_items        enable row level security;
alter table public.jobs               enable row level security;
alter table public.job_status_history enable row level security;
alter table public.job_photos         enable row level security;

-- businesses: user can read/write their own row
create policy "businesses_select_own" on public.businesses
  for select using (user_id = auth.uid());
create policy "businesses_insert_own" on public.businesses
  for insert with check (user_id = auth.uid());
create policy "businesses_update_own" on public.businesses
  for update using (user_id = auth.uid());

-- pricing_items: scoped to the user's business
create policy "pricing_items_select_own" on public.pricing_items
  for select using (business_id = public.current_business_id());
create policy "pricing_items_insert_own" on public.pricing_items
  for insert with check (business_id = public.current_business_id());
create policy "pricing_items_update_own" on public.pricing_items
  for update using (business_id = public.current_business_id());

-- quotes: scoped to the user's business
create policy "quotes_select_own" on public.quotes
  for select using (business_id = public.current_business_id());
create policy "quotes_insert_own" on public.quotes
  for insert with check (business_id = public.current_business_id());
create policy "quotes_update_own" on public.quotes
  for update using (business_id = public.current_business_id());

-- quote_items: join through quotes
create policy "quote_items_select_own" on public.quote_items
  for select using (
    exists (select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = public.current_business_id())
  );
create policy "quote_items_insert_own" on public.quote_items
  for insert with check (
    exists (select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = public.current_business_id())
  );
create policy "quote_items_update_own" on public.quote_items
  for update using (
    exists (select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = public.current_business_id())
  );
create policy "quote_items_delete_own" on public.quote_items
  for delete using (
    exists (select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = public.current_business_id())
  );

-- jobs
create policy "jobs_select_own" on public.jobs
  for select using (business_id = public.current_business_id());
create policy "jobs_insert_own" on public.jobs
  for insert with check (business_id = public.current_business_id());
create policy "jobs_update_own" on public.jobs
  for update using (business_id = public.current_business_id());

-- job_status_history
create policy "job_status_history_select_own" on public.job_status_history
  for select using (
    exists (select 1 from public.jobs j
      where j.id = job_status_history.job_id
        and j.business_id = public.current_business_id())
  );
create policy "job_status_history_insert_own" on public.job_status_history
  for insert with check (
    exists (select 1 from public.jobs j
      where j.id = job_status_history.job_id
        and j.business_id = public.current_business_id())
  );

-- job_photos
create policy "job_photos_select_own" on public.job_photos
  for select using (business_id = public.current_business_id());
create policy "job_photos_insert_own" on public.job_photos
  for insert with check (business_id = public.current_business_id());
create policy "job_photos_update_own" on public.job_photos
  for update using (business_id = public.current_business_id());
create policy "job_photos_delete_own" on public.job_photos
  for delete using (business_id = public.current_business_id());

-- NOTE: Public (unauthenticated) access to quotes for customer view
-- is handled via Edge Functions using the service_role key, NOT RLS.
-- This prevents token enumeration and allows server-side validation.
