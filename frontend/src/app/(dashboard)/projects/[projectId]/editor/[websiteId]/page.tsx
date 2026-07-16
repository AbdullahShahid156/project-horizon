'use client';

import {
  ArrowLeft,
  Eye,
  GitBranch,
  Monitor,
  Save,
  Download,
  Smartphone,
  Tablet,
  Undo2,
  Redo2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { websitesService } from '@/services/websites';
import { useAutoSave } from '@/hooks/use-auto-save';
import type { GeneratedWebsite, WebsiteOutput } from '@/types';
import { EditorPanel } from '@/features/editor/components/editor-panel';
import { WebsitePreview } from '@/features/editor/components/website-preview';

type EditorMode = 'edit' | 'preview';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export default function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string; websiteId: string }>;
}) {
  const { projectId, websiteId } = React.use(params);
  const router = useRouter();
  const [website, setWebsite] = React.useState<GeneratedWebsite | null>(null);
  const [content, setContent] = React.useState<WebsiteOutput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<EditorMode>('edit');
  const [device, setDevice] = React.useState<PreviewDevice>('desktop');
  const [saving, setSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [undoStack, setUndoStack] = React.useState<WebsiteOutput[]>([]);
  const [redoStack, setRedoStack] = React.useState<WebsiteOutput[]>([]);

  useAutoSave(websiteId, content, 30000);

  React.useEffect(() => {
    websitesService
      .get(websiteId)
      .then((w) => {
        setWebsite(w);
        if (w.aiResponse) {
          setContent(w.aiResponse as unknown as WebsiteOutput);
        }
      })
      .catch(() => router.push(`/projects/${projectId}`))
      .finally(() => setLoading(false));
  }, [websiteId, projectId, router]);

  const updateContent = React.useCallback(
    (path: string, value: unknown) => {
      if (!content) return;

      setUndoStack((prev) => [...prev.slice(-49), structuredClone(content)]);
      setRedoStack([]);

      const keys = path.split('.');
      const newContent = structuredClone(content) as Record<string, unknown>;
      let current: unknown = newContent;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (Array.isArray(current)) {
          current = current[parseInt(key)];
        } else if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[key];
        }
      }

      const lastKey = keys[keys.length - 1];
      if (Array.isArray(current)) {
        current[parseInt(lastKey)] = value;
      } else if (current && typeof current === 'object') {
        (current as Record<string, unknown>)[lastKey] = value;
      }

      setContent(newContent as WebsiteOutput);
    },
    [content],
  );

  const undo = React.useCallback(() => {
    if (undoStack.length === 0 || !content) return;
    setRedoStack((prev) => [...prev, structuredClone(content)]);
    setUndoStack((prev) => {
      const newStack = [...prev];
      const restored = newStack.pop()!;
      setContent(restored);
      return newStack;
    });
  }, [undoStack, content]);

  const redo = React.useCallback(() => {
    if (redoStack.length === 0 || !content) return;
    setUndoStack((prev) => [...prev, structuredClone(content)]);
    setRedoStack((prev) => {
      const newStack = [...prev];
      const restored = newStack.pop()!;
      setContent(restored);
      return newStack;
    });
  }, [redoStack, content]);

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await websitesService.update(websiteId, {
        content,
        changeSummary: 'Manual save',
      });
      setLastSaved(new Date());
    } catch {
      // handled
    }
    setSaving(false);
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!website || !content) return null;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-sm font-semibold">{website.name}</h1>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={undoStack.length === 0}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0}>
            <Redo2 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              size="sm"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              className="h-7 px-3"
              onClick={() => setMode('edit')}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={mode === 'preview' ? 'default' : 'ghost'}
              className="h-7 px-3"
              onClick={() => setMode('preview')}
            >
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Button>
          </div>

          {mode === 'preview' && (
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
          )}

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-1 h-3 w-3" />
            {saving ? 'Saving...' : 'Save'}
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${projectId}/editor/${websiteId}/versions`}>
              <GitBranch className="mr-1 h-3 w-3" />
              History
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${projectId}/editor/${websiteId}/export`}>
              <Download className="mr-1 h-3 w-3" />
              Export
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {mode === 'edit' ? (
          <>
            <ScrollArea className="w-96 border-r">
              <EditorPanel content={content} onUpdate={updateContent} />
            </ScrollArea>
            <div className="flex-1 bg-muted/20 p-4">
              <WebsitePreview content={content} device="desktop" />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/20 p-4">
            <WebsitePreview content={content} device={device} />
          </div>
        )}
      </div>
    </div>
  );
}
