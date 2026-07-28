"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  integrationsService,
  STATUS_COLORS,
  HEALTH_COLORS,
  type Integration,
  type Provider,
  type IntegrationLog,
  type SyncJob,
  type SyncedItem,
} from "@/services/integrations";
import {
  ArrowLeft,
  RefreshCw,
  Unplug,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
  AlertTriangle,
  Settings,
  FileText,
  Zap,
  Download,
  Upload,
  ExternalLink,
  Search,
  Database,
} from "lucide-react";

export default function IntegrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const integrationId = params.integrationId as string;
  const { addToast } = useToast();

  const [integration, setIntegration] = useState<Integration | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
  const [syncedTotal, setSyncedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [tab, setTab] = useState("overview");
  const [itemSearch, setItemSearch] = useState("");

  const [pushTitle, setPushTitle] = useState("");
  const [pushContent, setPushContent] = useState("");
  const [pushType, setPushType] = useState("post");
  const [pushing, setPushing] = useState(false);

  const loadIntegration = useCallback(async () => {
    try {
      setLoading(true);
      const ig = await integrationsService.getIntegration(integrationId);
      setIntegration(ig);

      const provs = await integrationsService.listProviders();
      const prov = provs.find((p) => p.id === ig.provider);
      setProvider(prov ?? null);

      const [logsRes, jobsRes, itemsRes] = await Promise.all([
        integrationsService.getLogs(integrationId),
        integrationsService.getSyncJobs(integrationId),
        integrationsService.listSyncedItems(integrationId, { page_size: 50 }),
      ]);
      setLogs(logsRes);
      setSyncJobs(jobsRes);
      setSyncedItems(itemsRes.items);
      setSyncedTotal(itemsRes.total);
    } catch {
      addToast({ title: "Failed to load integration", variant: "destructive" });
      router.push("/integrations");
    } finally {
      setLoading(false);
    }
  }, [integrationId, addToast, router]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await integrationsService.sync({
        integration_id: integrationId,
        sync_type: "manual",
      });
      addToast({ title: "Sync started", variant: "success" });
      await loadIntegration();
    } catch {
      addToast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handlePull = async () => {
    try {
      setPulling(true);
      const result = await integrationsService.pullData(integrationId);
      setSyncedItems(result.items);
      setSyncedTotal(result.total);
      addToast({
        title: `Pulled ${result.total} items from ${provider?.name ?? "provider"}`,
        variant: "success",
      });
      await loadIntegration();
    } catch {
      addToast({ title: "Pull failed", variant: "destructive" });
    } finally {
      setPulling(false);
    }
  };

  const handlePush = async () => {
    if (!pushTitle.trim() || !pushContent.trim()) {
      addToast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    try {
      setPushing(true);
      const result = await integrationsService.pushContent({
        integration_id: integrationId,
        item_type: pushType,
        title: pushTitle,
        content: pushContent,
      });
      if (result.success) {
        addToast({ title: result.message, variant: "success" });
        setPushTitle("");
        setPushContent("");
      } else {
        addToast({ title: result.message, variant: "destructive" });
      }
    } catch {
      addToast({ title: "Push failed", variant: "destructive" });
    } finally {
      setPushing(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setReconnecting(true);
      await integrationsService.reconnect(integrationId);
      addToast({ title: "Reconnected successfully", variant: "success" });
      await loadIntegration();
    } catch {
      addToast({ title: "Reconnection failed", variant: "destructive" });
    } finally {
      setReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await integrationsService.disconnectIntegration(integrationId);
      addToast({ title: "Integration disconnected", variant: "success" });
      router.push("/integrations");
    } catch {
      addToast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleToggleAutoSync = async (checked: boolean) => {
    if (!integration) return;
    try {
      await integrationsService.updateIntegration(integrationId, {
        auto_sync: checked,
      });
      setIntegration({ ...integration, auto_sync: checked });
      addToast({
        title: checked ? "Auto-sync enabled" : "Auto-sync disabled",
        variant: "success",
      });
    } catch {
      addToast({ title: "Failed to update setting", variant: "destructive" });
    }
  };

  const filteredItems = syncedItems.filter((item) => {
    if (!itemSearch) return true;
    const q = itemSearch.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q) ||
      (item.summary && item.summary.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!integration) return null;

  const isConnected = integration.status === "connected";
  const isFailed = integration.status === "failed";
  const supportsPull = provider && ["wordpress", "mailchimp", "slack", "twitter", "linkedin", "google_analytics", "google_search_console"].includes(provider.id);
  const supportsPush = provider && ["wordpress", "mailchimp", "slack", "discord", "twitter", "linkedin"].includes(provider.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{integration.name}</h1>
          <p className="text-sm text-muted-foreground">
            {provider?.name ?? integration.provider} · Connected{" "}
            {new Date(integration.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Button onClick={handlePull} disabled={pulling} variant="outline">
              {pulling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Pull Data
            </Button>
          )}
          {isConnected ? (
            <Button onClick={handleSync} disabled={syncing} variant="outline">
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync
            </Button>
          ) : isFailed ? (
            <Button onClick={handleReconnect} disabled={reconnecting}>
              {reconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reconnect
            </Button>
          ) : null}
          <Button variant="destructive" onClick={handleDisconnect}>
            <Unplug className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Activity className={`h-5 w-5 ${HEALTH_COLORS[integration.health_status] ?? HEALTH_COLORS.unknown}`} />
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge className={STATUS_COLORS[integration.status] ?? STATUS_COLORS.disconnected}>
                {integration.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">
                {integration.last_sync_at
                  ? new Date(integration.last_sync_at).toLocaleString()
                  : "Never synced"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Synced Items</p>
              <p className="text-xs text-muted-foreground">{syncedTotal} items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Auto-Sync</p>
              <Switch
                checked={integration.auto_sync}
                onCheckedChange={handleToggleAutoSync}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {integration.error_message && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{integration.error_message}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Settings className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="synced">
            <Database className="mr-2 h-4 w-4" />
            Synced Data ({syncedTotal})
          </TabsTrigger>
          {supportsPush && (
            <TabsTrigger value="push">
              <Upload className="mr-2 h-4 w-4" />
              Push Content
            </TabsTrigger>
          )}
          <TabsTrigger value="logs">
            <FileText className="mr-2 h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="syncs">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Provider</Label>
                  <p className="font-medium">{provider?.name ?? integration.provider}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">{provider?.category ?? "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Workspace</Label>
                  <p className="font-medium">{integration.workspace_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sync Interval</Label>
                  <p className="font-medium">{integration.sync_interval_minutes} minutes</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(integration.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="font-medium">{new Date(integration.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {provider && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Capabilities</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {supportsPull && <Badge variant="default">Pull Data</Badge>}
                      {supportsPush && <Badge variant="default">Push Content</Badge>}
                      <Badge variant="secondary">Health Check</Badge>
                      <Badge variant="secondary">Webhooks</Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synced" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Synced Data</CardTitle>
              <Button onClick={handlePull} disabled={pulling} size="sm">
                {pulling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Pull Latest
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search synced items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {syncedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Database className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No data synced yet. Click &quot;Pull Data&quot; to fetch items from {provider?.name ?? "this provider"}.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.item_type}
                          </Badge>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {item.summary && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(item.last_synced_at).toLocaleString()}
                          {item.external_id && (
                            <span className="font-mono text-[10px]">ID: {item.external_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {supportsPush && (
          <TabsContent value="push" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Push Content to {provider?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {provider?.id === "wordpress" && (
                      <>
                        <Button variant={pushType === "post" ? "default" : "outline"} size="sm" onClick={() => setPushType("post")}>Blog Post</Button>
                        <Button variant={pushType === "page" ? "default" : "outline"} size="sm" onClick={() => setPushType("page")}>Page</Button>
                      </>
                    )}
                    {provider?.id === "mailchimp" && (
                      <Button variant={pushType === "campaign" ? "default" : "outline"} size="sm" onClick={() => setPushType("campaign")}>Campaign</Button>
                    )}
                    {provider?.id === "slack" && (
                      <Button variant={pushType === "message" ? "default" : "outline"} size="sm" onClick={() => setPushType("message")}>Message</Button>
                    )}
                    {provider?.id === "discord" && (
                      <Button variant={pushType === "embed" ? "default" : "outline"} size="sm" onClick={() => setPushType("embed")}>Embed</Button>
                    )}
                    {provider?.id === "twitter" && (
                      <Button variant={pushType === "tweet" ? "default" : "outline"} size="sm" onClick={() => setPushType("tweet")}>Tweet</Button>
                    )}
                    {provider?.id === "linkedin" && (
                      <Button variant={pushType === "post" ? "default" : "outline"} size="sm" onClick={() => setPushType("post")}>Post</Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="push-content">Content</Label>
                  <textarea
                    id="push-content"
                    value={pushContent}
                    onChange={(e) => setPushContent(e.target.value)}
                    placeholder="Enter content (HTML supported)..."
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button onClick={handlePush} disabled={pushing}>
                  {pushing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Push to {provider?.name}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity logs yet.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                      {log.status === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{log.action.replace("_", " ")}</p>
                        {log.message && (
                          <p className="text-xs text-muted-foreground">{log.message}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                          {log.duration_ms != null && (
                            <span>· {Math.round(log.duration_ms)}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syncs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              {syncJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sync jobs yet.</p>
              ) : (
                <div className="space-y-3">
                  {syncJobs.map((job) => (
                    <div key={job.id} className="flex items-start gap-3 rounded-lg border p-3">
                      {job.status === "completed" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : job.status === "failed" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      ) : (
                        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">{job.sync_type} sync</p>
                          <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.items_synced} synced, {job.items_failed} failed
                          {job.duration_ms != null && ` · ${Math.round(job.duration_ms)}ms`}
                        </p>
                        {job.error_message && (
                          <p className="mt-1 text-xs text-red-600">{job.error_message}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(job.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
