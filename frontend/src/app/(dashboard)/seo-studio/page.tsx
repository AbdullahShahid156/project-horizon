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
  Plus,
  Globe,
  Trash2,
  Loader2,
  ExternalLink,
  Activity,
} from "lucide-react";
import { seoStudioService, type SEODomain } from "@/services/seo-studio";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
  return <Badge className={`${color} border-0`}>{score}</Badge>;
}

export default function SEOStudioPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<SEODomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ url: "", name: "" });
  const workspaceId = "default-workspace";

  const loadDomains = useCallback(async () => {
    try {
      const data = await seoStudioService.listDomains(workspaceId);
      setDomains(data ?? []);
    } catch (err) {
      console.error("Failed to load domains:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleCreate = async () => {
    if (!newDomain.url || !newDomain.name) return;
    try {
      setCreating(true);
      const url = newDomain.url.startsWith("http") ? newDomain.url : `https://${newDomain.url}`;
      const domain = await seoStudioService.createDomain({
        workspace_id: workspaceId,
        url,
        name: newDomain.name,
      });
      setDomains((prev) => [...prev, domain]);
      setNewDomain({ url: "", name: "" });
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create domain:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await seoStudioService.deleteDomain(id);
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete domain:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Studio</h1>
          <p className="text-muted-foreground">
            Monitor, audit, and optimize SEO for your websites.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Add domain">
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Domain</DialogTitle>
              <DialogDescription>Enter the domain you want to track and optimize.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain-name">Domain Name</Label>
                <Input
                  id="domain-name"
                  placeholder="My Website"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain-url">URL</Label>
                <Input
                  id="domain-url"
                  placeholder="https://example.com"
                  value={newDomain.url}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, url: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !newDomain.url || !newDomain.name}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Domain
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
      ) : domains.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No domains yet</h3>
            <p className="text-muted-foreground mb-4">
              Add a domain to start monitoring and optimizing SEO.
            </p>
            <Button onClick={() => setDialogOpen(true)}>Add Your First Domain</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <Card
              key={domain.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/seo-studio/${domain.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      {domain.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3" />
                      {domain.url}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} aria-label="Delete domain">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete domain?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all SEO data for {domain.name}. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(domain.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Health</p>
                    <ScoreBadge score={domain.health_score ?? 0} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Technical</p>
                    <ScoreBadge score={domain.technical_score ?? 0} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Content</p>
                    <ScoreBadge score={domain.content_score ?? 0} />
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {domain.last_audited_at ? (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {new Date(domain.last_audited_at).toLocaleDateString()}
                      </span>
                    ) : (
                      "Not audited"
                    )}
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
