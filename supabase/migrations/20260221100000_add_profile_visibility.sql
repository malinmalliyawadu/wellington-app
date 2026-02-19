-- Add profile visibility setting (public or private)
alter table profiles
  add column profile_visibility text not null default 'public'
  check (profile_visibility in ('public', 'private'));
