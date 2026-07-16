"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, RotateCcw, Loader2 } from "lucide-react";
import { contentStudioService, type ContentVersion } from "@/services/content-studio";

export default function ContentVersionsPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    try {
      const data = await contentStudioService.listVersions(contentId);
      setVersions(data ?? []);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleRestore = async (versionId: string) => {
    try {
      setRestoring(versionId);
      await contentStudioService.restoreVersion(contentId, versionId);
      router.push(`/content-studio/${contentId}/editor`);
    } catch (err) {
      console.error("Restore failed:", err);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-muted-foreground">
            {versions.length} version{versions.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-48 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : versions.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No versions yet</h3>
            <p className="text-muted-foreground mt-1">
              Versions are created automatically when you save changes.
            </p>
            <Button className="mt-4" onClick={() => router.push(`/content-studio/${contentId}/editor`)}>
              Go to Editor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {versions.map((v, i) => (
              <div key={v.id} className="relative pl-10">
                <div className={`absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 ${
                  i === 0 ? "bg-primary border-primary" : "bg-background border-border"
                }`} />
                <Card className={i === 0 ? "border-primary/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Version {v.version_number}</h3>
                          {v.is_auto_save && <Badge variant="secondary" className="text-[10px]">Auto-save</Badge>}
                          {i === 0 && <Badge className="text-[10px]">Current</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {v.change_summary || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </p>
                      </div>
                      {i !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(v.id)}
                          disabled={restoring === v.id}
                        >
                          {restoring === v.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Restore
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
