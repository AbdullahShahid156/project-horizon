'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ScrollText, Loader2, Filter, Building2, Folder, FileText,
  Sparkles, Globe, Mail, Link, Palette, Image, Send, Wand2,
  UserPlus, UserMinus, Shield, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import {
  activityLogService,
  type ActivityLogEntry,
  type ActivityStats,
} from '@/services/activity-log';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Folder, FileText, Sparkles, Globe, Mail, Link,
  Palette, Image, Send, Wand2, UserPlus, UserMinus, Shield, Activity,
};

const ENTITY_COLORS: Record<string, string> = {
  project: 'bg-violet-500/10 text-violet-500',
  website: 'bg-blue-500/10 text-blue-500',
  content: 'bg-emerald-500/10 text-emerald-500',
  campaign: 'bg-amber-500/10 text-amber-500',
  integration: 'bg-indigo-500/10 text-indigo-500',
  member: 'bg-pink-500/10 text-pink-500',
  organization: 'bg-orange-500/10 text-orange-500',
  brand: 'bg-purple-500/10 text-purple-500',
  landing_page: 'bg-cyan-500/10 text-cyan-500',
  social_post: 'bg-sky-500/10 text-sky-500',
  image: 'bg-rose-500/10 text-rose-500',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterEntity, setFilterEntity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        activityLogService.getLogs({ page, page_size: 15, entity_type: filterEntity || undefined }),
        activityLogService.getStats(),
      ]);
      setLogs(logsData.items);
      setTotalPages(logsData.total_pages);
      setTotal(logsData.total);
      setStats(statsData);
    } catch {
      console.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterEntity]);

  useEffect(() => { loadData(); }, [loadData]);

  const entityTypes = stats ? Object.entries(stats.by_entity).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader title="Activity Log" description="Track all actions across your organization.">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" />
          Filters {filterEntity && `(1)`}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Actions</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.total_actions}</div>
              <p className="mt-1 text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card className="hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <ScrollText className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.today_actions}</div>
              <p className="mt-1 text-xs text-muted-foreground">Actions today</p>
            </CardContent>
          </Card>
          <Card className="hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Users</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <UserPlus className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stats.unique_users}</div>
              <p className="mt-1 text-xs text-muted-foreground">Unique contributors</p>
            </CardContent>
          </Card>
          <Card className="hover:border-border/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entity Types</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Folder className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{entityTypes.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">Categories tracked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filter by:</span>
              <button
                onClick={() => { setFilterEntity(null); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !filterEntity ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {entityTypes.map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => { setFilterEntity(filterEntity === type ? null : type); setPage(1); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filterEntity === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type.replace(/_/g, ' ')} ({count})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <span className="text-xs text-muted-foreground">{total} total actions</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No activity logged yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-1">
                {logs.map((entry) => {
                  const IconComp = ICON_MAP[entry.icon] || Activity;
                  const colorClass = ENTITY_COLORS[entry.entityType] || 'bg-gray-500/10 text-gray-500';
                  return (
                    <div key={entry.id} className="relative flex gap-4 py-3 px-1 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm">
                          <span className="font-medium">{entry.userId}</span>
                          <span className="text-muted-foreground ml-1">{entry.description}</span>
                        </p>
                        {entry.entityName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground/80">{entry.entityName}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
