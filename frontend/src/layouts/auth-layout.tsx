import { Layout } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Layout className="h-4 w-4" />
          </div>
          <span className="text-sm tracking-tight">{APP_NAME}</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground/60">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  );
}
