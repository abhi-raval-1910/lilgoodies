create table public.packages (
    id text primary key,
    share_slug text not null unique,
    recipient text not null,
    sender text not null,
    items jsonb not null,
    amount integer not null default 0,
    status text not null check (status in ('pending', 'paid', 'free')),
    coupon_code text,
    created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "Public can read delivered packages"
on public.packages for select
using (status in ('paid', 'free'));

create policy "Public can create free packages"
on public.packages for insert
with check (status = 'free');

-- Migration for an existing packages table created before share links were added.
alter table public.packages add column if not exists share_slug text;

update public.packages
set share_slug = id
where share_slug is null;

alter table public.packages alter column share_slug set not null;
create unique index if not exists packages_share_slug_key on public.packages (share_slug);