'use client';

import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Use light theme',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Use dark theme',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow system preference',
  },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Customize the appearance of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid gap-4 sm:grid-cols-3">
            {themes.map((t) => (
              <div key={t.value}>
                <RadioGroupItem value={t.value} id={t.value} className="peer sr-only" />
                <Label
                  htmlFor={t.value}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all hover:bg-accent',
                    'peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary',
                  )}
                >
                  <t.icon className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
