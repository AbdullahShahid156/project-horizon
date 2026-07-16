'use client';

import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export default function OrganizationsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Organizations" description="Manage your organizations and teams.">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Building2 className="h-12 w-12" />}
        title="No organizations yet"
        description="Create an organization to collaborate with your team."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        }
      />
    </div>
  );
}
