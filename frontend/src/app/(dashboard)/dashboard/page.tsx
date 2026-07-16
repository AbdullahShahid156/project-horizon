import { Activity, BarChart3, FileText, Globe, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Projects',
    value: '12',
    change: '+2 this month',
    icon: FileText,
  },
  {
    title: 'Active Websites',
    value: '8',
    change: '3 published',
    icon: Globe,
  },
  {
    title: 'Team Members',
    value: '5',
    change: '2 online',
    icon: Users,
  },
  {
    title: 'Monthly Visitors',
    value: '12.4k',
    change: '+18% vs last month',
    icon: BarChart3,
  },
];

const recentActivity = [
  { action: 'Project "Landing Page" was updated', time: '2 hours ago' },
  { action: 'New member "Sarah" joined the workspace', time: '5 hours ago' },
  { action: 'Website "Acme Corp" was published', time: '1 day ago' },
  { action: 'Template "Portfolio" was customized', time: '2 days ago' },
  { action: 'Analytics report was generated', time: '3 days ago' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <p className="text-sm font-medium">Create a new project</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start building your next website with AI assistance.
                </p>
              </div>
              <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <p className="text-sm font-medium">Invite team members</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Collaborate with your team in real-time.
                </p>
              </div>
              <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <p className="text-sm font-medium">Explore templates</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose from our library of premium templates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
