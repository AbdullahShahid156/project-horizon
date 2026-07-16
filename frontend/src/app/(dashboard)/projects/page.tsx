'use client';

import { Globe, Plus, MoreHorizontal, Layers } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
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
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { projectsService } from '@/services/projects';
import type { Project } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    projectsService
      .list()
      .then((data) => setProjects(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await projectsService.delete(deleteId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
    } catch {
      // handled
    }
    setDeleteId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const dup = await projectsService.duplicate(id);
      setProjects((prev) => [dup, ...prev]);
    } catch {
      // handled
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Projects" description="Manage your website projects.">
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <SearchInput
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                      {project.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project.id}`}>Open</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(project.id)}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(project.id)}
                      >
                        Delete
                      </DropdownMenuItem>
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
                  {project.websites && project.websites.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {project.websites.length} website{project.websites.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {formatDate(project.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title={search ? 'No projects found' : 'No projects yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Create your first project to start building websites with AI.'
          }
          action={
            !search ? (
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Project"
        description="This action cannot be undone. All associated websites will also be deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
