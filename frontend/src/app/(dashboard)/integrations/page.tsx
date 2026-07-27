"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  integrationsService,
  INTEGRATION_CATEGORIES,
  STATUS_COLORS,
  HEALTH_COLORS,
  type Integration,
  type Provider,
  type IntegrationStats,
} from "@/services/integrations";
import {
  Plus,
  Search,
  Globe,
  ShoppingCart,
  Send,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Link2,
  Unplug,
  Activity,
  Settings,
  Clock,
  AlertTriangle,
} from "lucide-react";

const WORKSPACE_ID = "ws-default";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cms: Globe,
  ecommerce: ShoppingCart,
  marketing: Send,
  productivity: MessageSquare,
  analytics: BarChart3,
};

function IconWithColor({
  Icon,
  color,
  className,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ color }}>
      <Icon className="h-full w-full" />
    </span>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("integrations");
  const [connecting, setConnecting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [intRes, provRes, statsRes] = await Promise.all([
        integrationsService.listIntegrations(WORKSPACE_ID, {
          category: categoryFilter === "all" ? undefined : categoryFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search || undefined,
          page,
          page_size: 12,
        }),
        integrationsService.listProviders(),
        integrationsService.getStats(WORKSPACE_ID),
      ]);
      setIntegrations(intRes.items);
      setTotal(intRes.total);
      setTotalPages(intRes.total_pages);
      setProviders(provRes);
      setStats(statsRes);
    } catch {
      addToast({ title: "Failed to load integrations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, search, page, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async (provider: Provider) => {
    const credentials: Record<string, string> = {};
    for (const field of provider.fields) {
      if (field.required) {
        credentials[field.key] = "";
      }
    }
    // Navigate to the provider's connect page
    router.push(`/integrations/connect/${provider.id}`);
  };

  const handleSync = async (integrationId: string) => {
    try {
      setConnecting(integrationId);
      await integrationsService.sync({
        integration_id: integrationId,
        sync_type: "manual",
      });
      addToast({ title: "Sync started", variant: "success" });
      await loadData();
    } catch {
      addToast({ title: "Sync failed", variant: "destructive" });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await integrationsService.disconnectIntegration(integrationId);
      addToast({ title: "Integration disconnected", variant: "success" });
      await loadData();
    } catch {
      addToast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleReconnect = async (integrationId: string) => {
    try {
      setConnecting(integrationId);
      await integrationsService.reconnect(integrationId);
      addToast({ title: "Reconnected successfully", variant: "success" });
      await loadData();
    } catch {
      addToast({ title: "Reconnection failed", variant: "destructive" });
    } finally {
      setConnecting(null);
    }
  };

  const getProviderInfo = (providerId: string) => {
    return providers.find((p) => p.id === providerId);
  };

  const connectedCount = stats?.connected ?? 0;
  const failedCount = stats?.failed ?? 0;
  const totalCount = stats?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations Hub</h1>
          <p className="text-muted-foreground">
            Connect third-party services and manage your integrations
          </p>
        </div>
        <Link href="/integrations/connect">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="integrations">
            <Link2 className="mr-2 h-4 w-4" />
            My Integrations
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <Globe className="mr-2 h-4 w-4" />
            Provider Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Total Integrations</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connectedCount}</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INTEGRATION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="syncing">Syncing</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48 mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Link2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No integrations yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect your first third-party service to get started.
                </p>
                <Link href="/integrations/connect">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Integration
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((ig) => {
                const prov = getProviderInfo(ig.provider);
                const CatIcon = CATEGORY_ICONS[prov?.category ?? "cms"] ?? Globe;
                return (
                  <Card key={ig.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${prov?.color ?? "#6b7280"}20` }}
                          >
                            <IconWithColor
                              Icon={CatIcon}
                              color={prov?.color ?? "#6b7280"}
                              className="h-5 w-5"
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{ig.name}</h3>
                            <p className="text-xs text-muted-foreground">{prov?.name ?? ig.provider}</p>
                          </div>
                        </div>
                        <Badge className={STATUS_COLORS[ig.status] ?? STATUS_COLORS.disconnected}>
                          {ig.status}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className={`h-3 w-3 ${HEALTH_COLORS[ig.health_status] ?? HEALTH_COLORS.unknown}`} />
                        <span className="capitalize">{ig.health_status}</span>
                        {ig.last_sync_at && (
                          <>
                            <span>·</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(ig.last_sync_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {ig.error_message && (
                        <div className="mt-2 flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="truncate">{ig.error_message}</span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <Link href={`/integrations/${ig.id}`}>
                          <Button variant="outline" size="sm">
                            <Settings className="mr-1 h-3 w-3" />
                            Details
                          </Button>
                        </Link>
                        {ig.status === "connected" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(ig.id)}
                            disabled={connecting === ig.id}
                          >
                            {connecting === ig.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-3 w-3" />
                            )}
                            Sync
                          </Button>
                        ) : ig.status === "failed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(ig.id)}
                            disabled={connecting === ig.id}
                          >
                            {connecting === ig.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-3 w-3" />
                            )}
                            Reconnect
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-destructive hover:text-destructive"
                          onClick={() => handleDisconnect(ig.id)}
                        >
                          <Unplug className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            INTEGRATION_CATEGORIES.map((cat) => {
              const catProviders = providers.filter((p) => p.category === cat.id);
              if (catProviders.length === 0) return null;
              const CatIcon = CATEGORY_ICONS[cat.id] ?? Globe;
              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CatIcon className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{cat.label}</h2>
                    <Badge variant="secondary">{catProviders.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {catProviders.map((prov) => (
                      <Card key={prov.id} className="group cursor-pointer transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${prov.color}20` }}
                            >
                              <IconWithColor
                                Icon={CatIcon}
                                color={prov.color}
                                className="h-5 w-5"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold">{prov.name}</h3>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {prov.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {prov.fields.length} field{prov.fields.length !== 1 ? "s" : ""} required
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnect(prov)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
