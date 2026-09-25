-- Applied to the "radar" Supabase project as migration create_tracked_leads.
create table if not exists public.tracked_leads (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lead_id)
);

alter table public.tracked_leads enable row level security;

create policy "Each user sees only their own leads" on public.tracked_leads
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
