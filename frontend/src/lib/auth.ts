export async function getAuthUser() {
  return {
    userId: 'mock-user-id',
    orgId: null,
    orgRole: null,
    user: null,
    isAuthenticated: false,
  };
}

export function getPermissionsForRole(_role: string | null): string[] {
  return ['read', 'write', 'delete', 'admin'];
}

export function hasPermission(
  _role: string | null,
  _permission: string,
): boolean {
  return true;
}
