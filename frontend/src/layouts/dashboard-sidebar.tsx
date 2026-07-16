'use client';

import { ChevronLeft, ChevronRight, Layout, Building2, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APP_NAME } from '@/constants';
import { dashboardNavItems, type NavItem } from '@/config/dashboard';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  if (item.disabled) {
    return collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-40',
              'cursor-not-allowed',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title} (coming soon)</TooltipContent>
      </Tooltip>
    ) : (
      <span
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground opacity-40',
          'cursor-not-allowed',
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
        {!collapsed && item.label && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">Soon</span>
        )}
      </span>
    );
  }

  const content = (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <item.icon className={cn(
        'h-4 w-4 shrink-0 transition-colors',
        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-accent-foreground',
      )} />
      {!collapsed && <span>{item.title}</span>}
      {!collapsed && item.label && (
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {item.label}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function DashboardSidebar() {
  const { isOpen, isCollapsed, toggleCollapse, close } = useSidebar();

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [close]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 md:relative md:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-16' : 'md:w-64',
        )}
        role="navigation"
        aria-label="Dashboard navigation"
      >
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 font-semibold',
              isCollapsed && 'md:justify-center',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layout className="h-4 w-4" />
            </div>
            {!isCollapsed && <span className="text-sm tracking-tight">{APP_NAME}</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden h-7 w-7 md:flex text-muted-foreground hover:text-foreground"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-5">
            {dashboardNavItems.map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {section.title}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <NavItemLink key={item.href} item={item} collapsed={isCollapsed} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator />

        <div className={cn('p-3', isCollapsed && 'md:flex md:justify-center')}>
          <button
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
              isCollapsed && 'md:justify-center md:px-0',
            )}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>My Organization</span>}
          </button>
        </div>

        <div className={cn('border-t p-3', isCollapsed && 'md:flex md:justify-center')}>
          <button
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors',
              isCollapsed && 'md:justify-center md:px-0',
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            {!isCollapsed && (
              <div className="ml-0.5 text-left">
                <p className="text-xs font-medium">Account</p>
                <p className="text-[11px] text-muted-foreground">Manage profile</p>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
