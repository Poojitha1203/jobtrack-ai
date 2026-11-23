-- Kanban: change an application's status and re-order its column in one transaction.
-- security invoker = runs as the calling user, so Row Level Security still applies.

create or replace function public.move_application(
  p_application_id uuid,
  p_status public.application_status,
  p_ordered_ids uuid[],
  p_applied_at date default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.applications
  set status = p_status,
      applied_at = case
        when p_status <> 'wishlist' and applied_at is null then p_applied_at
        else applied_at
      end
  where id = p_application_id;

  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  update public.applications a
  set position = o.ord - 1
  from unnest(p_ordered_ids) with ordinality as o(id, ord)
  where a.id = o.id
    and a.status = p_status
    and a.position is distinct from (o.ord - 1)::integer;
end;
$$;

revoke execute on function public.move_application(uuid, public.application_status, uuid[], date) from public, anon;
grant execute on function public.move_application(uuid, public.application_status, uuid[], date) to authenticated;

notify pgrst, 'reload schema';
