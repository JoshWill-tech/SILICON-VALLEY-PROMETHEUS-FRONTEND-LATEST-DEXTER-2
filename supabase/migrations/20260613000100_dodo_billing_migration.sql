-- Rename legacy Paddle-era tables instead of dropping user data.
alter table if exists public.subscriptions rename to subscriptions_paddle_legacy;
alter table if exists public.payments rename to payments_paddle_legacy;
alter table if exists public.invoices rename to invoices_paddle_legacy;
alter table if exists public.plans rename to plans_paddle_legacy;

-- Core Dodo subscription state.
create table if not exists public.dodo_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  dodo_subscription_id text unique not null,
  dodo_customer_id text not null,
  product_id text not null,
  status text not null check (status in ('active', 'on_hold', 'cancelled', 'expired', 'pending', 'failed')),
  tier text not null check (tier in ('creator', 'studio', 'cinema')),
  price_cents integer not null,
  currency text not null default 'USD',
  billing_interval text not null default 'month',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dodo_subscriptions_user_id_idx on public.dodo_subscriptions(user_id);
create index if not exists dodo_subscriptions_customer_id_idx on public.dodo_subscriptions(dodo_customer_id);
create index if not exists dodo_subscriptions_status_idx on public.dodo_subscriptions(status);

-- Saved cards / recurring methods.
create table if not exists public.dodo_payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  dodo_payment_method_id text unique not null,
  dodo_customer_id text,
  type text not null,
  last_four text,
  brand text,
  expiry_month integer,
  expiry_year integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists dodo_payment_methods_user_id_idx on public.dodo_payment_methods(user_id);
create index if not exists dodo_payment_methods_customer_id_idx on public.dodo_payment_methods(dodo_customer_id);

-- Internal credit accounting aligned with Prometheus AI usage.
create table if not exists public.dodo_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subscription_id uuid references public.dodo_subscriptions(id) on delete cascade,
  credit_type text not null default 'ai_generation',
  total_allocated integer not null,
  total_used integer not null default 0,
  total_remaining integer generated always as (total_allocated - total_used) stored,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dodo_credits_user_id_idx on public.dodo_credits(user_id);
create index if not exists dodo_credits_subscription_id_idx on public.dodo_credits(subscription_id);

-- Webhook event ledger for idempotency and support.
create table if not exists public.dodo_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  error_message text
);

create index if not exists dodo_webhook_events_status_idx on public.dodo_webhook_events(status);

-- Payment/invoice history cached from Dodo.
create table if not exists public.dodo_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  dodo_payment_id text not null,
  dodo_subscription_id text,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null,
  invoice_url text,
  created_at timestamptz not null default now()
);

create index if not exists dodo_invoices_user_id_idx on public.dodo_invoices(user_id);
create index if not exists dodo_invoices_subscription_id_idx on public.dodo_invoices(dodo_subscription_id);
create unique index if not exists dodo_invoices_payment_id_idx on public.dodo_invoices(dodo_payment_id);

alter table public.dodo_subscriptions enable row level security;
alter table public.dodo_payment_methods enable row level security;
alter table public.dodo_credits enable row level security;
alter table public.dodo_invoices enable row level security;

drop policy if exists "Users can view own subscriptions" on public.dodo_subscriptions;
create policy "Users can view own subscriptions"
on public.dodo_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own payment methods" on public.dodo_payment_methods;
create policy "Users can view own payment methods"
on public.dodo_payment_methods
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own credits" on public.dodo_credits;
create policy "Users can view own credits"
on public.dodo_credits
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own invoices" on public.dodo_invoices;
create policy "Users can view own invoices"
on public.dodo_invoices
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.deduct_credits(p_user_id uuid, p_cost integer)
returns void
language plpgsql
as $$
begin
  update public.dodo_credits
  set total_used = total_used + p_cost,
      updated_at = now()
  where user_id = p_user_id
    and total_remaining >= p_cost
    and (period_end is null or period_end >= now());

  if not found then
    raise exception 'Insufficient credits';
  end if;
end;
$$;
