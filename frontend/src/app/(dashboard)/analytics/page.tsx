'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Eye, MousePointerClick, Clock, TrendingUp,
  TrendingDown, Globe, Monitor, Smartphone, Tablet, Loader2,
  RefreshCw, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  analyticsService,
  type AnalyticsOverview,
  type TimeseriesPoint,
  type PageMetric,
  type TrafficSource,
  type DeviceInfo,
  type CountryInfo,
  type RealtimeData,
} from '@/services/analytics';

const PERIODS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
] as const;

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  suffix,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card className="group hover:border-border/80 transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}/10`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">
          {value}
          {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={isPositive ? 'text-emerald-500' : 'text-red-500'}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [pages, setPages] = useState<PageMetric[]>([]);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [browsers, setBrowsers] = useState<DeviceInfo[]>([]);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [chartMetric, setChartMetric] = useState<'visitors' | 'pageviews'>('visitors');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, pagesData, sourcesData, devicesData, countriesData] = await Promise.all([
        analyticsService.getDashboard(period),
        analyticsService.getPages({ page_size: 10 }),
        analyticsService.getSources(),
        analyticsService.getDevices(),
        analyticsService.getCountries(),
      ]);
      setOverview(dash.overview);
      setTimeseries(dash.timeseries);
      setRealtime(dash.realtime);
      setPages(pagesData.items);
      setSources(sourcesData.sources);
      setDevices(devicesData.devices);
      setBrowsers(devicesData.browsers);
      setCountries(countriesData.countries);
    } catch {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh realtime every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const rt = await analyticsService.getRealtime();
        setRealtime(rt);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track your website performance and visitor behavior.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Realtime badge */}
          {realtime && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {realtime.active_users} live
            </div>
          )}
          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Visitors"
            value={formatNumber(overview.total_visitors)}
            change={overview.visitors_change}
            icon={Users}
            color="text-indigo-500"
          />
          <StatCard
            title="Pageviews"
            value={formatNumber(overview.total_pageviews)}
            change={overview.pageviews_change}
            icon={Eye}
            color="text-violet-500"
          />
          <StatCard
            title="Bounce Rate"
            value={overview.bounce_rate}
            change={-overview.bounce_rate_change}
            icon={MousePointerClick}
            color="text-amber-500"
            suffix="%"
          />
          <StatCard
            title="Avg. Session"
            value={formatDuration(overview.avg_session_duration * 60)}
            change={overview.session_change}
            icon={Clock}
            color="text-emerald-500"
          />
        </div>
      )}

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Traffic Overview</CardTitle>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setChartMetric('visitors')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMetric === 'visitors'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Visitors
              </button>
              <button
                onClick={() => setChartMetric('pageviews')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMetric === 'pageviews'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pageviews
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === 'visitors' ? 'Visitors' : 'Pageviews',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke={chartMetric === 'visitors' ? '#6366f1' : '#8b5cf6'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={chartMetric === 'visitors' ? 'url(#colorVisitors)' : 'url(#colorPageviews)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sources + Devices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="sessions"
                    >
                      {sources.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                    formatNumber(value),
                    'Sessions',
                  ]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {sources.map((source, i) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground flex-1 truncate">{source.name}</span>
                    <span className="text-sm font-medium">{source.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Devices & Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Devices</p>
                <div className="space-y-2">
                  {devices.map((device) => {
                    const DeviceIcon = device.name === 'Desktop' ? Monitor : device.name === 'Mobile' ? Smartphone : Tablet;
                    return (
                      <div key={device.name} className="flex items-center gap-3">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{device.name}</span>
                        <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{device.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Browsers</p>
                <div className="space-y-2">
                  {browsers.map((browser) => (
                    <div key={browser.name} className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1">{browser.name}</span>
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${browser.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{browser.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Last {period === '7d' ? '7' : period === '30d' ? '30' : '90'} days
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Page</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Pageviews</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique Visitors</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Bounce Rate</th>
                  <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Time</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.path} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      <div>
                        <p className="text-sm font-medium">{page.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{page.path}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm font-medium">{formatNumber(page.pageviews)}</td>
                    <td className="py-3 text-right text-sm text-muted-foreground">{formatNumber(page.unique_visitors)}</td>
                    <td className="py-3 text-right text-sm text-muted-foreground">{page.bounce_rate}%</td>
                    <td className="py-3 text-right text-sm text-muted-foreground">{page.avg_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countries.slice(0, 8).map((country) => (
              <div key={country.code} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:border-border transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
                  {country.code === 'US' ? '🇺🇸' : country.code === 'GB' ? '🇬🇧' : country.code === 'DE' ? '🇩🇪' :
                   country.code === 'CA' ? '🇨🇦' : country.code === 'FR' ? '🇫🇷' : country.code === 'AU' ? '🇦🇺' :
                   country.code === 'IN' ? '🇮🇳' : '🌍'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{country.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(country.sessions)} sessions</p>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{country.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
