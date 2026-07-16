'use client';

import { Bell, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const notificationGroups = [
  {
    title: 'Email Notifications',
    icon: Mail,
    items: [
      { label: 'Project updates', description: 'When a project is updated or changed.' },
      { label: 'Team mentions', description: 'When someone mentions you in a comment.' },
      { label: 'Weekly digest', description: 'Receive a weekly summary of activity.' },
    ],
  },
  {
    title: 'Push Notifications',
    icon: Bell,
    items: [
      { label: 'New members', description: 'When a new member joins your organization.' },
      { label: 'Task assignments', description: 'When you are assigned to a task.' },
      { label: 'Comment replies', description: 'When someone replies to your comment.' },
    ],
  },
  {
    title: 'In-App Notifications',
    icon: MessageSquare,
    items: [
      { label: 'Achievements', description: 'When you unlock a new achievement.' },
      { label: 'Announcements', description: 'Product updates and announcements.' },
      { label: 'Tips & tricks', description: 'Helpful tips to get the most out of the platform.' },
    ],
  },
];

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      {notificationGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <group.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>Manage your {group.title.toLowerCase()} preferences.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                {i < group.items.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button>Save Notification Preferences</Button>
    </div>
  );
}
