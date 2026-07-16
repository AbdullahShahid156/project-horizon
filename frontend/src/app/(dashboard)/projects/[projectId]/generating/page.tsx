'use client';

import { Check, Loader2, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GENERATION_STEPS } from '@/constants/generator';
import { aiService } from '@/services';
import type { WebsitePrompt } from '@/types';
import { cn } from '@/lib/utils';

export default function GeneratingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const runGeneration = async () => {
      try {
        const stored = sessionStorage.getItem(`generator-prompt-${projectId}`);
        if (!stored) {
          router.push(`/projects/${projectId}/generate`);
          return;
        }

        const prompt: WebsitePrompt = JSON.parse(stored);
        const projectName = prompt.businessName || 'My Website';

        const steps = GENERATION_STEPS.length;
        const stepDuration = 2000;
        let stepIdx = 0;

        const stepTimer = setInterval(() => {
          stepIdx++;
          if (stepIdx < steps) {
            setCurrentStep(stepIdx);
          }
        }, stepDuration);

        const result = await aiService.generateWebsite({
          project_id: projectId,
          name: projectName,
          prompt,
        });

        clearInterval(stepTimer);
        setCurrentStep(steps - 1);

        sessionStorage.removeItem(`generator-prompt-${projectId}`);

        setTimeout(() => {
          router.push(`/projects/${projectId}/editor/${result.id}`);
        }, 1000);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred during generation.',
        );
      }
    };

    void runGeneration();
  }, [projectId, router]);

  const handleRetry = async () => {
    setError(null);
    setRetrying(true);
    setCurrentStep(0);
    startedRef.current = false;

    try {
      const stored = sessionStorage.getItem(`generator-prompt-${projectId}`);
      if (!stored) {
        router.push(`/projects/${projectId}/generate`);
        return;
      }

      const prompt: WebsitePrompt = JSON.parse(stored);
      const projectName = prompt.businessName || 'My Website';

      const steps = GENERATION_STEPS.length;
      const stepDuration = 2000;
      let stepIdx = 0;

      const stepTimer = setInterval(() => {
        stepIdx++;
        if (stepIdx < steps) {
          setCurrentStep(stepIdx);
        }
      }, stepDuration);

      const result = await aiService.generateWebsite({
        project_id: projectId,
        name: projectName,
        prompt,
      });

      clearInterval(stepTimer);
      setCurrentStep(steps - 1);
      sessionStorage.removeItem(`generator-prompt-${projectId}`);

      setTimeout(() => {
        router.push(`/projects/${projectId}/editor/${result.id}`);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during generation.',
      );
    }
    setRetrying(false);
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          {error ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Wand2 className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Generation Failed</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{error}</p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
                <Button onClick={handleRetry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Wand2 className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-lg font-semibold">Generating Your Website</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our AI is crafting your website. This usually takes a minute...
                </p>
              </div>

              <div className="space-y-3">
                {GENERATION_STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3 text-sm transition-colors',
                      i < currentStep && 'bg-primary/5',
                      i === currentStep && 'bg-primary/10',
                      i > currentStep && 'opacity-40',
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {i < currentStep ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : i === currentStep ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{step.id}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
