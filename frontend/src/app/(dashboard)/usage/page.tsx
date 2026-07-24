"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Zap,
  Loader2,
} from "lucide-react";
import { engineService, type UsageSummary, type DailyUsage, type UsageHistoryItem, type CacheStats } from "@/services/engine";

export default function UsageDashboardPage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [daily, setDaily] = useState<DailyUsage[]>([]);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [s, d, h, c] = await Promise.all([
        engineService.getUsageSummary(30),
        engineService.getDailyUsage(30),
        engineService.getUsageHistory(50),
        engineService.getCacheStats(),
      ]);
      setSummary(s ?? null);
      setDaily(d ?? []);
      setHistory(h ?? []);
      setCacheStats(c ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load usage data";
      setError(message);
      console.error("Failed to load usage data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await engineService.clearCache();
      const c = await engineService.getCacheStats();
      setCacheStats(c);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor AI generations, token usage, and performance.
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Make sure the backend server is running at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_generations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.successes} succeeded, {summary.failures} failed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_tokens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${summary.total_cost.toFixed(4)} estimated cost
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.success_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.cached} cached ({summary.cache_rate}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avg_latency_ms.toFixed(0)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Usage</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage (Last 30 Days)</CardTitle>
              <CardDescription>Token usage and generations per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {daily.slice(-10).map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">{day.date}</span>
                    <div className="flex-1">
                      <div className="h-4 rounded bg-primary/10 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded"
                          style={{
                            width: `${Math.min(100, (day.generations / Math.max(...daily.map((d) => d.generations), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-20 text-right">{day.generations} gen</span>
                    <span className="text-sm text-muted-foreground w-24 text-right">{day.tokens.toLocaleString()} tok</span>
                    <span className="text-sm text-muted-foreground w-16 text-right">${day.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Generations</CardTitle>
              <CardDescription>Last 50 AI operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No generations yet.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      {item.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.operation}</span>
                          <Badge variant="outline" className="text-xs">{item.provider}</Badge>
                          {item.cached && <Badge variant="secondary" className="text-xs">cached</Badge>}
                        </div>
                        {item.error && (
                          <p className="text-xs text-red-500 truncate">{item.error}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm">{item.total_tokens.toLocaleString()} tok</div>
                        <div className="text-xs text-muted-foreground">{item.latency_ms.toFixed(0)}ms</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Provider</CardTitle>
              </CardHeader>
              <CardContent>
                {summary && Object.entries(summary.providers).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-1">
                    <span className="text-sm">{name}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Model</CardTitle>
              </CardHeader>
              <CardContent>
                {summary && Object.entries(summary.models).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-1">
                    <span className="text-sm">{name}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Operation</CardTitle>
              </CardHeader>
              <CardContent>
                {summary && Object.entries(summary.operations).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-1">
                    <span className="text-sm">{name}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>In-memory response cache</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCache} disabled={clearing}>
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear Cache
              </Button>
            </CardHeader>
            <CardContent>
              {cacheStats && (
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Entries</div>
                    <div className="text-2xl font-bold">{cacheStats.size} / {cacheStats.max_size}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hits</div>
                    <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Misses</div>
                    <div className="text-2xl font-bold text-orange-600">{cacheStats.misses}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                    <div className="text-2xl font-bold">{cacheStats.hit_rate}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
