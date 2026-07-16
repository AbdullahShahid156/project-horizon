'use client';

import { Save } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your photo and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-base">U</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">Change Avatar</Button>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or GIF. 1MB max.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="user@example.com" disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for assistance.</p>
          </div>

          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your language and timezone settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="en">
              <SelectTrigger id="language" className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="America/New_York">
              <SelectTrigger id="timezone" className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
