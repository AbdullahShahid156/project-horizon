'use client';

import { Layers, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { formatDate } from '@/lib/utils';

const mockWorkspaces = [
  {
    id: '1',
    name: 'Marketing',
    slug: 'marketing',
    description: 'Marketing team workspace',
    createdAt: new Date('2024-01-15'),
    projectCount: 5,
    memberCount: 3,
  },
  {
    id: '2',
    name: 'Development',
    slug: 'development',
    description: 'Engineering workspace',
    createdAt: new Date('2024-02-20'),
    projectCount: 8,
    memberCount: 6,
  },
  {
    id: '3',
    name: 'Design',
    slug: 'design',
    description: 'Design team workspace',
    createdAt: new Date('2024-03-10'),
    projectCount: 3,
    memberCount: 2,
  },
];

export default function WorkspacesPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Workspaces" description="Manage your workspaces and projects.">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </PageHeader>

      {mockWorkspaces.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockWorkspaces.map((workspace) => (
            <Card key={workspace.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{workspace.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {workspace.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/workspaces/${workspace.id}`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{workspace.projectCount} projects</span>
                  <span>{workspace.memberCount} members</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {formatDate(workspace.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No workspaces yet"
          description="Create your first workspace to get started."
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          }
        />
      )}
    </div>
  );
}
