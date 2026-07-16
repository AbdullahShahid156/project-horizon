'use client';

import { Clock, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { websitesService } from '@/services/websites';
import type { WebsiteVersion } from '@/types';
import { formatDate } from '@/lib/utils';

export default function VersionHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string; websiteId: string }>;
}) {
  const { projectId, websiteId } = React.use(params);
  const router = useRouter();
  const [versions, setVersions] = React.useState<WebsiteVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [restoring, setRestoring] = React.useState<number | null>(null);

  React.useEffect(() => {
    websitesService
      .listVersions(websiteId)
      .then((data) => setVersions(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber);
    try {
      await websitesService.restoreVersion(websiteId, versionNumber);
      router.push(`/projects/${projectId}/editor/${websiteId}`);
    } catch {
      setRestoring(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Version History"
        description="View and restore previous versions of your website."
      >
        <Button variant="outline" onClick={() => router.back()}>
          Back to Editor
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : versions.length > 0 ? (
        <div className="space-y-4">
          {[...versions].reverse().map((version) => (
            <Card key={version.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        Version {version.versionNumber}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDate(version.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {version.isAutoSave && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-save
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(version.versionNumber)}
                      disabled={restoring === version.versionNumber}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      {restoring === version.versionNumber ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {version.changeSummary && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{version.changeSummary}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No versions yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Versions are created when you save or auto-save your website.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
