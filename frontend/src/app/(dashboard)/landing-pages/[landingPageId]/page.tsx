'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, Clock, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { landingPagesService } from '@/services';

interface LandingPageData {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function LandingPageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lpId = params.landingPageId as string;
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLandingPage = useCallback(async () => {
    try {
      const data = await landingPagesService.getById(lpId);
      setLandingPage(data);
    } catch {
      setLandingPage({
        id: lpId,
        name: 'Landing Page',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [lpId]);

  useEffect(() => {
    loadLandingPage();
  }, [loadLandingPage]);

  const handleDelete = async () => {
    try {
      await landingPagesService.delete(lpId);
      router.push('/landing-pages');
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/landing-pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {landingPage?.name ?? 'Landing Page'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your landing page.
          </p>
        </div>
        <Badge variant={landingPage?.status === 'published' ? 'default' : 'secondary'}>
          {landingPage?.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/landing-pages/${lpId}/editor`}>
                <Edit className="mr-2 h-4 w-4" />
                Open Editor
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/landing-pages/${lpId}/preview`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/landing-pages/${lpId}/versions`}>
                <Clock className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Export</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/landing-pages/${lpId}/export`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Export
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
