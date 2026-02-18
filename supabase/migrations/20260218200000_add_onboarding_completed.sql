alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Existing users have already onboarded
update public.profiles set onboarding_completed = true;
