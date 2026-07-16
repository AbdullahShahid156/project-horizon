'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';

export function DashboardHeader() {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggle}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:flex md:items-center md:gap-2">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Link>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
}
