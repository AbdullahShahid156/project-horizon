'use client';

import { Layers, MoreHorizontal, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

const mockProjects = [
  { id: '1', name: 'Landing Page', status: 'published' as const, updatedAt: new Date(), pages: 5 },
  { id: '2', name: 'Blog Redesign', status: 'draft' as const, updatedAt: new Date('2024-06-01'), pages: 3 },
  { id: '3', name: 'E-commerce Store', status: 'draft' as const, updatedAt: new Date('2024-05-28'), pages: 12 },
];

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Marketing" description="Marketing team workspace">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/workspaces/${workspaceId}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      {mockProjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <Card key={project.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={project.status === 'published' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {project.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{project.pages} pages</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(project.updatedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No projects yet"
          description="Create your first project in this workspace."
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          }
        />
      )}
    </div>
  );
}
