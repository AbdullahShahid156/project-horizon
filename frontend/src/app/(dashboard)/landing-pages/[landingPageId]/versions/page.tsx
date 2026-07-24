"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Loader2,
  Diff,
} from "lucide-react";
import { landingPagesService } from "@/services/landing-pages";
import type { LandingPage, LandingPageVersion, LandingPageOutput } from "@/types";

export default function LandingPageVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const lpId = params.landingPageId as string;

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [versions, setVersions] = useState<LandingPageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<LandingPageVersion | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [lp, vers] = await Promise.all([
        landingPagesService.getById(lpId),
        landingPagesService.listVersions(lpId),
      ]);
      setLandingPage(lp ?? null);
      setVersions((vers ?? []).sort((a, b) => b.versionNumber - a.versionNumber));
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  }, [lpId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestore = async (versionNumber: number) => {
    setRestoring(versionNumber);
    try {
      await landingPagesService.restoreVersion(lpId, versionNumber);
      await loadData();
      router.push(`/landing-pages/${lpId}/editor`);
    } catch (err) {
      console.error("Failed to restore:", err);
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/landing-pages/${lpId}/editor`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-muted-foreground">
            {landingPage?.name} — {versions.length} version{versions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No versions yet</h3>
            <p className="text-muted-foreground">
              Save your landing page to create a version.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {versions.map((version, i) => {
              const isCurrent = version.versionNumber === landingPage?.currentVersion;
              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={isCurrent ? "border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            v{version.versionNumber}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              Version {version.versionNumber}
                              {isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {version.isAutoSave && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-save
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(version.createdAt)}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedVersion(
                                selectedVersion?.id === version.id ? null : version
                              )
                            }
                            aria-label={selectedVersion?.id === version.id ? "Close preview" : `View version ${version.versionNumber}`}
                          >
                            <Diff className="mr-1 h-3 w-3" />
                            {selectedVersion?.id === version.id ? "Close" : "View"}
                          </Button>
                          {!isCurrent && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <RotateCcw className="mr-1 h-3 w-3" />
                                  Restore
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Restore version {version.versionNumber}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will create a new version with the content from version {version.versionNumber}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRestore(version.versionNumber)}
                                    disabled={restoring === version.versionNumber}
                                  >
                                    {restoring === version.versionNumber ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <RotateCcw className="mr-1 h-3 w-3" />
                                    )}
                                    Restore
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {version.changeSummary && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">
                          {version.changeSummary}
                        </p>
                      </CardContent>
                    )}

                    {selectedVersion?.id === version.id && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <VersionDiff content={version.content} />
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function VersionDiff({ content }: { content: LandingPageOutput }) {
  if (!content) return <p className="text-sm text-muted-foreground">No content</p>;

  return (
    <div className="space-y-4 text-sm">
      <h4 className="font-semibold">Content Preview</h4>
      {content.hero && (
        <div className="rounded-lg bg-muted p-3 space-y-1">
          <div className="font-medium">{content.hero.headline}</div>
          <div className="text-muted-foreground text-xs">{content.hero.subheadline}</div>
        </div>
      )}
      {content.features && content.features.length > 0 && (
        <div>
          <div className="font-medium mb-1">Features ({content.features.length})</div>
          <div className="grid grid-cols-2 gap-2">
            {content.features.slice(0, 4).map((f, i) => (
              <div key={i} className="text-xs bg-muted rounded p-2">
                <span className="font-medium">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.pricing && content.pricing.length > 0 && (
        <div>
          <div className="font-medium mb-1">Pricing ({content.pricing.length})</div>
          <div className="flex gap-2">
            {content.pricing.map((p, i) => (
              <div key={i} className="text-xs bg-muted rounded p-2">
                {p.name}: {p.price}
              </div>
            ))}
          </div>
        </div>
      )}
      {content.seo && (
        <div className="text-xs text-muted-foreground">
          SEO: {content.seo.title} — {content.seo.description?.slice(0, 80)}...
        </div>
      )}
    </div>
  );
}
