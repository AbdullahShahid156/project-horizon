"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Gauge,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { performanceStudioService, type PerformanceAudit } from "@/services/performance-studio";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <Badge className={`${color} border-0`}>{score}</Badge>;
}

export default function PerformanceStudioPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<PerformanceAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState("");
  const projectId = "default-project";

  const loadAudits = useCallback(async () => {
    try {
      const data = await performanceStudioService.listAudits(projectId);
      setAudits(data ?? []);
    } catch (err) {
      console.error("Failed to load audits:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const handleRunAudit = async () => {
    if (!url) return;
    try {
      setCreating(true);
      const auditUrl = url.startsWith("http") ? url : `https://${url}`;
      const result = await performanceStudioService.runAudit(projectId, auditUrl);
      setAudits((prev) => [result, ...prev]);
      setUrl("");
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to run audit:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Studio</h1>
          <p className="text-muted-foreground">
            Analyze and optimize website performance with AI-powered insights.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Run audit">
              <Plus className="mr-2 h-4 w-4" />
              Run Audit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run Performance Audit</DialogTitle>
              <DialogDescription>Enter the URL you want to analyze.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="audit-url">Website URL</Label>
                <Input
                  id="audit-url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRunAudit(); }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRunAudit} disabled={creating || !url}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run Audit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="h-6 w-12 bg-muted rounded" />
                  <div className="h-6 w-12 bg-muted rounded" />
                  <div className="h-6 w-12 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : audits.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="text-center">
            <Gauge className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No audits yet</h3>
            <p className="text-muted-foreground mb-4">
              Run your first performance audit to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)}>Run Your First Audit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audits.map((audit) => (
            <Card
              key={audit.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/performance-studio/${projectId}?audit=${audit.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="truncate">{audit.url}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{audit.url}</span>
                    </CardDescription>
                  </div>
                   <ScoreBadge score={audit.overall_score ?? 0} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Perf</p>
                    <ScoreBadge score={audit.performance_score ?? 0} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">A11y</p>
                    <ScoreBadge score={audit.accessibility_score ?? 0} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">BP</p>
                    <ScoreBadge score={audit.best_practices_score ?? 0} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">SEO</p>
                    <ScoreBadge score={audit.seo_score ?? 0} />
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {new Date(audit.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
