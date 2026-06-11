-- Migration: Add subscriptions table for Paddle integration
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null, -- 'active', 'trialing', 'past_due', 'paused', 'deleted'
  plan_id text not null, -- 'creator', 'studio', 'cinema'
  paddle_subscription_id text unique,
  paddle_customer_id text,
  price_id text,
  next_billing_date timestamptz,
  card_brand text,
  card_last_4 text,
  card_expiry_month integer,
  card_expiry_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- RLS Policies
drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid());

-- Index for fast lookups
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_paddle_subscription_id_idx on public.subscriptions(paddle_subscription_id);
