export async function getAuthUser() {
  return {
    userId: 'mock-user-id',
    orgId: null,
    orgRole: null,
    user: null,
    isAuthenticated: false,
  };
}

export function getPermissionsForRole(role: string | null): string[] {
  return ['read', 'write', 'delete', 'admin'];
}

export function hasPermission(
  role: string | null,
  permission: string,
): boolean {
  return true;
}
