'use client';

import { ArrowLeft, Code, FileJson, FileText, FileCode, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { websitesService } from '@/services/websites';
import { generateHtml, generateMarkdown, generateZip } from '@/features/editor/utils/export';
import type { GeneratedWebsite, WebsiteOutput } from '@/types';

export default function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string; websiteId: string }>;
}) {
  const { projectId, websiteId } = React.use(params);
  const router = useRouter();
  const [website, setWebsite] = React.useState<GeneratedWebsite | null>(null);
  const [content, setContent] = React.useState<WebsiteOutput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exportFormat, setExportFormat] = React.useState('json');

  React.useEffect(() => {
    websitesService
      .get(websiteId)
      .then((w) => {
        setWebsite(w);
        if (w.aiResponse) setContent(w.aiResponse as unknown as WebsiteOutput);
      })
      .catch(() => router.push(`/projects/${projectId}`))
      .finally(() => setLoading(false));
  }, [websiteId, projectId, router]);

  const handleDownload = (filename: string, data: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!content || !website) return;

    switch (exportFormat) {
      case 'json': {
        const data = JSON.stringify(content, null, 2);
        handleDownload(`${website.slug}.json`, data, 'application/json');
        break;
      }
      case 'markdown': {
        const data = generateMarkdown(content);
        handleDownload(`${website.slug}.md`, data, 'text/markdown');
        break;
      }
      case 'html': {
        const data = generateHtml(content);
        handleDownload(`${website.slug}.html`, data, 'text/html');
        break;
      }
      case 'zip': {
        const blob = await generateZip(content);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${website.slug}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      }
    }
  };

  if (loading || !content || !website) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Export Website" description="Export your website in various formats.">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Editor
        </Button>
      </PageHeader>

      <Tabs defaultValue="json" onValueChange={setExportFormat}>
        <TabsList>
          <TabsTrigger value="json">
            <FileJson className="mr-2 h-4 w-4" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="markdown">
            <FileText className="mr-2 h-4 w-4" />
            Markdown
          </TabsTrigger>
          <TabsTrigger value="html">
            <FileCode className="mr-2 h-4 w-4" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="zip">
            <Code className="mr-2 h-4 w-4" />
            ZIP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>JSON Export</CardTitle>
              <CardDescription>Raw structured data of your website.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={JSON.stringify(content, null, 2)}
                className="h-96 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Export</CardTitle>
              <CardDescription>Formatted markdown document.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={generateMarkdown(content)}
                className="h-96 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HTML Export</CardTitle>
              <CardDescription>Complete HTML page ready to deploy.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={generateHtml(content)}
                className="h-96 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ZIP Export</CardTitle>
              <CardDescription>
                Complete package with HTML, CSS, and all assets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Download a complete ZIP file with your website ready to deploy.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Download {exportFormat.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
