"use client";

import { useCallback, useEffect, useRef } from "react";
import { landingPagesService } from "@/services/landing-pages";
import type { LandingPageOutput } from "@/types";

export function useLandingPageAutoSave(
  landingPageId: string | null,
  content: LandingPageOutput | null,
  intervalMs: number = 30000,
) {
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(async () => {
    if (!landingPageId || !content) return;
    const contentStr = JSON.stringify(content);
    if (contentStr === lastSavedRef.current) return;

    try {
      await landingPagesService.autoSave(landingPageId, content);
      lastSavedRef.current = contentStr;
    } catch {
      // silent fail for auto-save
    }
  }, [landingPageId, content]);

  useEffect(() => {
    if (!landingPageId) return;

    timerRef.current = setInterval(save, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [landingPageId, intervalMs, save]);

  return { saveNow: save };
}
