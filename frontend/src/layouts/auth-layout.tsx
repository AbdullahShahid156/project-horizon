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
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layout className="h-4 w-4" />
          </div>
          <span className="text-sm">{APP_NAME}</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
