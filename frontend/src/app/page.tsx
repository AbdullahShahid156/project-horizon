import { ArrowRight, BarChart3, Globe, Layout, Palette, Zap, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { APP_NAME, APP_DESCRIPTION } from '@/constants';

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Building',
    description: 'Generate stunning business websites with AI in minutes, not weeks.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Palette,
    title: 'Beautiful Templates',
    description: 'Start with premium templates and customize every detail.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Globe,
    title: 'SEO Optimized',
    description: 'Built-in SEO tools to help your site rank higher on search.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track performance with detailed analytics and insights.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

const stats = [
  { value: '10k+', label: 'Websites Built' },
  { value: '99.9%', label: 'Uptime' },
  { value: '2.5s', label: 'Avg Load Time' },
  { value: '4.9/5', label: 'User Rating' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layout className="h-4 w-4" />
            </div>
            <span className="text-sm tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              AI-Powered Website Builder
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Build Your Business Website with{' '}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
                AI Power
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{APP_DESCRIPTION}</p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="xl" asChild>
                <Link href="/signup">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Everything you need</h2>
            <p className="mt-2 text-sm text-muted-foreground">Powerful features to build, optimize, and scale your web presence.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all duration-200 hover:border-border hover:shadow-sm"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/50 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Ready to get started?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Join thousands of businesses building with AI.</p>
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start Building Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground/60 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
