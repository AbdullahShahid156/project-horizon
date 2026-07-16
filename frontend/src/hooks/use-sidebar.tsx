'use client';

import * as React from 'react';

type SidebarContextType = {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  toggleCollapse: () => void;
  open: () => void;
  close: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleCollapse = React.useCallback(() => setIsCollapsed((prev) => !prev), []);
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, toggle, toggleCollapse, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
