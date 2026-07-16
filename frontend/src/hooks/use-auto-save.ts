'use client';

import { useCallback, useEffect, useRef } from 'react';
import { websitesService } from '@/services/websites';
import type { WebsiteOutput } from '@/types';

export function useAutoSave(
  websiteId: string | null,
  content: WebsiteOutput | null,
  intervalMs: number = 30000,
) {
  const lastSavedRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(async () => {
    if (!websiteId || !content) return;
    const contentStr = JSON.stringify(content);
    if (contentStr === lastSavedRef.current) return;

    try {
      await websitesService.autoSave(websiteId, content);
      lastSavedRef.current = contentStr;
    } catch {
      // silent fail for auto-save
    }
  }, [websiteId, content]);

  useEffect(() => {
    if (!websiteId) return;

    timerRef.current = setInterval(save, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [websiteId, intervalMs, save]);

  return { saveNow: save };
}
