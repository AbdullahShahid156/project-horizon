'use client';

import { Activity, BarChart3, FileText, Globe, Users, ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const stats = [
  {
    title: 'Total Projects',
    value: '12',
    change: '+2 this month',
    trend: 'up',
    icon: FileText,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    title: 'Active Websites',
    value: '8',
    change: '3 published',
    trend: 'up',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Team Members',
    value: '5',
    change: '2 online',
    trend: 'neutral',
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Monthly Visitors',
    value: '12.4k',
    change: '+18% vs last month',
    trend: 'up',
    icon: BarChart3,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

const recentActivity = [
  { action: 'Project "Landing Page" was updated', time: '2 hours ago', color: 'bg-violet-500' },
  { action: 'New member "Sarah" joined the workspace', time: '5 hours ago', color: 'bg-blue-500' },
  { action: 'Website "Acme Corp" was published', time: '1 day ago', color: 'bg-emerald-500' },
  { action: 'Template "Portfolio" was customized', time: '2 days ago', color: 'bg-amber-500' },
  { action: 'Analytics report was generated', time: '3 days ago', color: 'bg-pink-500' },
];

const quickActions = [
  { title: 'Create a new project', description: 'Start building your next website with AI assistance.', icon: Sparkles },
  { title: 'Invite team members', description: 'Collaborate with your team in real-time.', icon: Users },
  { title: 'Explore templates', description: 'Choose from our library of premium templates.', icon: FileText },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={stat.title} className="group hover:border-border/80 transition-all duration-200" style={{ animationDelay: `${i * 50}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentActivity.map((activity, i) => (
                <div key={i} className="group flex items-center gap-4 py-3 border-b border-border/50 last:border-0 last:pb-0 first:pt-0">
                  <div className="relative">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activity.color}/10`}>
                      <Activity className={`h-3.5 w-3.5 ${activity.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="group w-full rounded-lg border border-border/50 p-4 text-left transition-all duration-200 hover:border-border hover:bg-accent/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
