"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { socialStudioService, type SocialStats } from "@/services/social-studio";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Sparkles,
  Globe,
  FileText,
  Send,
  Calendar,
  Target,
} from "lucide-react";

const PLATFORM_EMOJIS: Record<string, string> = {
  facebook: "📘", instagram: "📷", linkedin: "💼", twitter: "🐦",
  threads: "🧵", tiktok: "🎵", pinterest: "📌", youtube: "📺",
};

export default function SocialAnalyticsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await socialStudioService.getStats("ws-default");
      setStats(data ?? null);
    } catch {
      addToast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxPlatform = stats ? Math.max(...Object.values(stats.by_platform ?? {}), 1) : 1;
  const maxType = stats ? Math.max(...Object.values(stats.by_type ?? {}), 1) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social Media Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your social media performance</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Posts", value: stats.total_posts, icon: FileText, color: "text-blue-500" },
              { label: "Published", value: stats.by_status?.["published"] ?? 0, icon: Send, color: "text-green-500" },
              { label: "AI Generated", value: stats.ai_generated_count, icon: Sparkles, color: "text-purple-500" },
              { label: "Campaigns", value: stats.total_campaigns, icon: Target, color: "text-orange-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                  <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Platform Usage</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.by_platform ?? {}).sort(([, a], [, b]) => b - a).map(([platform, count]) => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="text-lg w-8">{PLATFORM_EMOJIS[platform] || "📱"}</span>
                    <span className="text-sm w-24 capitalize">{platform}</span>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(count / maxPlatform) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.by_platform ?? {}).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Post Types</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.by_type ?? {}).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm w-24 capitalize">{type.replace(/-/g, " ")}</span>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${(count / maxType) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.by_type ?? {}).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stats.by_status ?? {}).map(([status, count]) => (
                    <div key={status} className="p-3 border rounded-lg text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Performance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{stats.avg_performance_score?.toFixed(1) ?? "0.0"}</p>
                  <p className="text-sm text-muted-foreground">Avg Performance Score</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 border rounded">
                    <p className="text-lg font-bold">{stats.ai_generated_count}</p>
                    <p className="text-xs text-muted-foreground">AI Posts</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className="text-lg font-bold">{stats.total_posts > 0 ? ((stats.ai_generated_count / stats.total_posts) * 100).toFixed(0) : 0}%</p>
                    <p className="text-xs text-muted-foreground">AI Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
