'use client';

import { useEffect, useState } from 'react';
import {
  Building2, Plus, Loader2, AlertCircle, Users,
  MoreHorizontal, Trash2, Crown, Shield, Eye, UserMinus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { organizationsService } from '@/services/organizations';
import type { Organization, Membership } from '@/types';

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-amber-500 bg-amber-500/10',
  admin: 'text-blue-500 bg-blue-500/10',
  member: 'text-emerald-500 bg-emerald-500/10',
  viewer: 'text-gray-500 bg-gray-500/10',
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const loadOrgs = async () => {
    setError(null);
    try {
      const data = await organizationsService.list();
      setOrgs(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  const loadMembers = async (orgId: string) => {
    setLoadingMembers(true);
    try {
      const data = await organizationsService.getMembers(orgId);
      setMembers(data ?? []);
    } catch {
      console.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const slug = createName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const org = await organizationsService.create({ name: createName, slug });
      setOrgs([...orgs, org]);
      setShowCreate(false);
      setCreateName('');
      setSelectedOrg(org);
      await loadMembers(org.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedOrg) return;
    setInviting(true);
    try {
      await organizationsService.inviteMember(selectedOrg.id, { email: inviteEmail, role: inviteRole });
      await loadMembers(selectedOrg.id);
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrg) return;
    try {
      await organizationsService.removeMember(selectedOrg.id, memberId);
      await loadMembers(selectedOrg.id);
      setActionMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    try {
      await organizationsService.delete(orgId);
      setOrgs(orgs.filter(o => o.id !== orgId));
      if (selectedOrg?.id === orgId) {
        setSelectedOrg(null);
        setMembers([]);
      }
      setActionMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization');
    }
  };

  const selectOrg = async (org: Organization) => {
    setSelectedOrg(org);
    await loadMembers(org.id);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Organizations" description="Manage your organizations, teams, and members.">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </PageHeader>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setError(null)}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Organization</CardTitle>
              <CardDescription>Set up a new organization for your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="My Team"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!createName.trim() || creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
              <CardDescription>Invite someone to {selectedOrg.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="admin">Admin — Full access</option>
                  <option value="member">Member — Can edit</option>
                  <option value="viewer">Viewer — Read only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
                  {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No organizations yet"
          description="Create an organization to collaborate with your team."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Create Organization</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Org List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Organizations ({orgs.length})</h3>
            {orgs.map((org) => (
              <Card
                key={org.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOrg?.id === org.id ? 'border-primary ring-1 ring-primary/20' : ''
                }`}
                onClick={() => selectOrg(org)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{org.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">{org.plan} plan</CardDescription>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === org.id ? null : org.id); }}
                        className="rounded-md p-1 hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {actionMenu === org.id && (
                        <div className="absolute right-0 top-8 z-10 w-40 rounded-md border bg-popover p-1 shadow-md">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id); }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Members Panel */}
          <div className="lg:col-span-2">
            {selectedOrg ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{selectedOrg.name} — Members</CardTitle>
                      <CardDescription>Manage team members and their roles</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowInvite(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Invite
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No members yet. Invite someone to get started.</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => {
                        const RoleIcon = ROLE_ICONS[member.role] || Users;
                        const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.member;
                        const isOwner = member.role === 'owner';
                        return (
                          <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:border-border transition-colors">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${roleColor}`}>
                              <RoleIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.email || member.userId}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role} · Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                            </div>
                            {!isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select an organization to manage members</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
