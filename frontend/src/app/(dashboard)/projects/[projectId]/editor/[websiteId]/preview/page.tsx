'use client';

import { ArrowLeft, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { websitesService } from '@/services/websites';
import { WebsitePreview } from '@/features/editor/components/website-preview';
import type { WebsiteOutput } from '@/types';
import { cn } from '@/lib/utils';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<PreviewDevice, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

export default function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string; websiteId: string }>;
}) {
  const { projectId, websiteId } = React.use(params);
  const router = useRouter();
  const [content, setContent] = React.useState<WebsiteOutput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [device, setDevice] = React.useState<PreviewDevice>('desktop');

  React.useEffect(() => {
    websitesService
      .get(websiteId)
      .then((w) => {
        if (w.aiResponse) setContent(w.aiResponse as unknown as WebsiteOutput);
      })
      .catch(() => router.push(`/projects/${projectId}`))
      .finally(() => setLoading(false));
  }, [websiteId, projectId, router]);

  if (loading || !content) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Preview" description="Preview your website in different screen sizes.">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Editor
        </Button>
        <div className="flex items-center rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={device === 'desktop' ? 'default' : 'ghost'}
            className="h-7 px-2"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={device === 'tablet' ? 'default' : 'ghost'}
            className="h-7 px-2"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={device === 'mobile' ? 'default' : 'ghost'}
            className="h-7 px-2"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-3 w-3" />
          </Button>
        </div>
      </PageHeader>

      <div className="flex justify-center">
        <div
          className={cn(
            'overflow-hidden rounded-lg border bg-white shadow-lg transition-all',
            deviceWidths[device],
          )}
        >
          <WebsitePreview content={content} device={device} />
        </div>
      </div>
    </div>
  );
}
