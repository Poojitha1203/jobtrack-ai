import { useState } from 'react';
import { Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { Pagination } from '../../components/ui/Pagination.tsx';
import { SelectField } from '../../components/ui/SelectField.tsx';
import { Skeleton } from '../../components/ui/Skeleton.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';
import { useToast } from '../../hooks/useToast.ts';
import { listAdminUsers, updateAdminUser, USERS_PAGE_SIZE } from '../../services/admin.ts';
import { inputClasses } from '../../lib/formStyles.ts';
import { formatDateTime } from '../../lib/format.ts';
import type { AdminUser, AdminUserFilters, AdminUserUpdate } from '../../types/admin.ts';

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface PendingChange {
  user: AdminUser;
  change: AdminUserUpdate;
}

function describeChange({ user, change }: PendingChange) {
  const who = user.fullName || user.email;
  if ('role' in change) {
    return change.role === 'admin'
      ? { title: 'Make admin?', label: 'Make admin', message: `${who} will be able to see every user's account details and change roles and plans.` }
      : { title: 'Remove admin access?', label: 'Remove admin', message: `${who} will lose access to the admin pages immediately.` };
  }
  return change.plan === 'pro'
    ? { title: 'Grant Pro?', label: 'Grant Pro', message: `${who} gets Pro for 30 days without a payment. Useful for testing or support.` }
    : { title: 'Revoke Pro?', label: 'Revoke Pro', message: `${who} moves to the Free plan now. Free limits apply straight away.` };
}

export function AdminUsersPage() {
  useDocumentTitle('Users');
  const { user: me } = useAuth();
  const showToast = useToast();
  const [filters, setFilters] = useState<AdminUserFilters>({ search: '', plan: '', role: '', page: 1 });
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error, loading, setData } = useAsyncData(() => listAdminUsers(filters), JSON.stringify(filters));

  const update = (changes: Partial<AdminUserFilters>) => setFilters((f) => ({ ...f, page: 1, ...changes }));
  const applySearch = useDebouncedCallback((value: string) => update({ search: value.trim() }), 350);

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const updated = await updateAdminUser(pending.user.id, pending.change);
      setData((current) => ({ ...current, items: current.items.map((u) => (u.id === updated.id ? updated : u)) }));
      showToast(`${describeChange(pending).label}: ${updated.email}`, 'success');
      setPending(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const dialog = pending ? describeChange(pending) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Search accounts, change roles and grant or revoke Pro." />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="user-search"
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              applySearch(e.target.value);
            }}
            className={inputClasses(false, 'pl-9')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <SelectField label="Plan" hideLabel value={filters.plan} onChange={(e) => update({ plan: e.target.value as AdminUserFilters['plan'] })} className="sm:w-36">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </SelectField>
          <SelectField label="Role" hideLabel value={filters.role} onChange={(e) => update({ role: e.target.value as AdminUserFilters['role'] })} className="sm:w-36">
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </SelectField>
        </div>
      </div>

      {error ? (
        <Alert tone="error" title="Couldn't load users">{error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          {!data ? (
            <div className="space-y-3 p-5" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : data.items.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
          ) : (
            <div className={loading ? 'overflow-x-auto opacity-60 transition-opacity' : 'overflow-x-auto'}>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">User</th>
                    <th scope="col" className="px-5 py-3 font-medium">Role</th>
                    <th scope="col" className="px-5 py-3 font-medium">Plan</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Applications</th>
                    <th scope="col" className="px-5 py-3 font-medium">Last active</th>
                    <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((u) => {
                    const isMe = u.id === me?.id;
                    return (
                      <tr key={u.id} className="align-middle">
                        <td className="max-w-64 px-5 py-3">
                          <p className="truncate font-medium text-slate-900">
                            {u.fullName || '—'} {isMe && <span className="text-xs font-normal text-slate-500">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          {u.role === 'admin' ? (
                            <Badge tone="violet"><ShieldCheck className="size-3" aria-hidden="true" /> Admin</Badge>
                          ) : (
                            <Badge>User</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {u.plan === 'pro' ? (
                            <div>
                              <Badge tone="brand"><Sparkles className="size-3" aria-hidden="true" /> Pro</Badge>
                              {u.currentPeriodEnd && (
                                <p className="mt-1 text-xs whitespace-nowrap text-slate-500">
                                  {u.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {shortDate.format(new Date(u.currentPeriodEnd))}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge>Free</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-900 tabular-nums">{u.applicationCount}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                          {u.lastActivityAt ? formatDateTime(u.lastActivityAt) : 'No activity'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-600">{shortDate.format(new Date(u.createdAt))}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isMe}
                              title={isMe ? "You can't change your own role" : undefined}
                              onClick={() => setPending({ user: u, change: { role: u.role === 'admin' ? 'user' : 'admin' } })}
                            >
                              {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setPending({ user: u, change: { plan: u.plan === 'pro' ? 'free' : 'pro' } })}
                            >
                              {u.plan === 'pro' ? 'Revoke Pro' : 'Grant Pro'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data && data.total > 0 && (
            <div className="border-t border-slate-200 px-5 py-3">
              <Pagination page={data.page} pageSize={USERS_PAGE_SIZE} total={data.total} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        confirmLabel={dialog?.label}
        loading={saving}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
