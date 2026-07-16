'use client';

export function useCurrentOrganization() {
  return {
    organization: null,
    membership: null,
    isLoaded: true,
    role: null,
  };
}
