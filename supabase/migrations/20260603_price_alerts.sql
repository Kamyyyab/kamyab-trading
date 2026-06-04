-- Price alerts table
create table if not exists price_alerts (
  id          bigserial primary key,
  user_id     uuid references auth.users not null,
  symbol      text not null,
  price       numeric not null,
  label       text,
  last_price  numeric,                     -- previous fetched price (for crossing detection)
  triggered   boolean default false,
  triggered_price numeric,
  triggered_at    timestamptz,
  created_at  timestamptz default now()
);

alter table price_alerts enable row level security;
create policy "Users manage own alerts"
  on price_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Push subscriptions table (one per browser/device)
create table if not exists push_subscriptions (
  id           bigserial primary key,
  user_id      uuid references auth.users not null,
  subscription jsonb not null,
  created_at   timestamptz default now(),
  unique(user_id, (subscription->>'endpoint'))
);

alter table push_subscriptions enable row level security;
create policy "Users manage own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
