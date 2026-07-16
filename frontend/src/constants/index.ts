export const APP_NAME = 'BuilderWeb';
export const APP_DESCRIPTION = 'AI Business Website Builder & Optimization Platform';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export const PERMISSIONS = {
  workspace: {
    create: 'workspace:create' as const,
    delete: 'workspace:delete' as const,
    edit: 'workspace:edit' as const,
  },
  member: {
    invite: 'member:invite' as const,
    remove: 'member:remove' as const,
    manage: 'member:manage' as const,
  },
  project: {
    create: 'project:create' as const,
    delete: 'project:delete' as const,
    edit: 'project:edit' as const,
  },
  settings: {
    read: 'settings:read' as const,
    write: 'settings:write' as const,
  },
  billing: {
    read: 'billing:read' as const,
    write: 'billing:write' as const,
  },
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.values(PERMISSIONS).flatMap((p) => Object.values(p)),
  admin: [
    PERMISSIONS.workspace.create,
    PERMISSIONS.workspace.edit,
    PERMISSIONS.member.invite,
    PERMISSIONS.member.manage,
    PERMISSIONS.project.create,
    PERMISSIONS.project.edit,
    PERMISSIONS.settings.read,
    PERMISSIONS.settings.write,
    PERMISSIONS.billing.read,
  ],
  member: [
    PERMISSIONS.workspace.create,
    PERMISSIONS.project.create,
    PERMISSIONS.project.edit,
    PERMISSIONS.settings.read,
  ],
  viewer: [PERMISSIONS.settings.read],
};

export const PLANS = [
  { id: 'free', name: 'Free', price: 0 },
  { id: 'starter', name: 'Starter', price: 29 },
  { id: 'professional', name: 'Professional', price: 99 },
  { id: 'enterprise', name: 'Enterprise', price: 299 },
] as const;

export const THEMES = ['light', 'dark', 'system'] as const;

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
] as const;

export const TIMEZONES = Intl.supportedValuesOf('timeZone');

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const HEADER_HEIGHT = 56;
export const MAX_CONTENT_WIDTH = 1440;
