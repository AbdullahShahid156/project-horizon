'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';

export function DashboardHeader() {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-xl md:px-6">
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
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-9 w-9"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
}
