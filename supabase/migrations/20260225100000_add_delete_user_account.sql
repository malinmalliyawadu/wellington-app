-- Function to allow authenticated users to delete their own account.
-- SECURITY DEFINER runs with the privileges of the function owner (postgres),
-- which has permission to delete from auth.users.
-- CASCADE rules on foreign keys handle cleanup of all related data.
create or replace function public.delete_user_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Only authenticated users can call this function
revoke all on function public.delete_user_account() from public;
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;
