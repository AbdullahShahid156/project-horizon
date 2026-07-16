'use client';

import { ArrowRight, Globe, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { projectsService } from '@/services/projects';
import type { Project, GeneratedWebsite } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const router = useRouter();
  const [project, setProject] = React.useState<Project | null>(null);
  const [websites, setWebsites] = React.useState<GeneratedWebsite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showDelete, setShowDelete] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      projectsService.get(projectId),
      projectsService.listWebsites(projectId),
    ])
      .then(([p, w]) => {
        setProject(p ?? null);
        setWebsites(w ?? []);
      })
      .catch(() => router.push('/projects'))
      .finally(() => setLoading(false));
  }, [projectId, router]);

  const handleDelete = async () => {
    try {
      await projectsService.delete(projectId);
      router.push('/projects');
    } catch {
      // handled
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title={project.name} description={project.description ?? undefined}>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/generate`}>
            <Settings className="mr-2 h-4 w-4" />
            Generate Website
          </Link>
        </Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <Badge variant={project.status === 'published' ? 'success' : 'secondary'}>
          {project.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Created {formatDate(project.createdAt)}
        </span>
      </div>

      {websites.length > 0 ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Websites</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((site) => (
              <Card key={site.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{site.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Version {site.currentVersion}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={site.status === 'published' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {site.status}
                  </Badge>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/projects/${projectId}/editor/${site.id}`}>
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projects/${projectId}/editor/${site.id}/preview`}>
                        Preview
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No websites yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate your first website with AI.
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/projects/${projectId}/generate`}>
                Generate Website
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Project"
        description="This action cannot be undone. All associated websites will also be deleted."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
