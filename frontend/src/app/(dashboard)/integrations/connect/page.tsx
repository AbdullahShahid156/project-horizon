"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  integrationsService,
  INTEGRATION_CATEGORIES,
  type Provider,
} from "@/services/integrations";
import {
  ArrowLeft,
  Search,
  Globe,
  Send,
  Bell,
  Share2,
  BarChart3,
  Plus,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cms: Globe,
  marketing: Send,
  notifications: Bell,
  social: Share2,
  analytics: BarChart3,
};

function IconWithColor({
  Icon,
  color,
  className,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ color }}>
      <Icon className="h-full w-full" />
    </span>
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadProviders = useCallback(async () => {
    try {
      const data = await integrationsService.listProviders(
        categoryFilter === "all" ? undefined : categoryFilter
      );
      setProviders(data);
    } catch {
      addToast({ title: "Failed to load providers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, addToast]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filtered = providers.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Integration</h1>
          <p className="text-sm text-muted-foreground">
            Choose a provider to connect to your workspace
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Button>
          {INTEGRATION_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">No providers found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prov) => {
            const CatIcon = CATEGORY_ICONS[prov.category] ?? Globe;
            return (
              <Card key={prov.id} className="group cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${prov.color}20` }}
                    >
                      <IconWithColor Icon={CatIcon} color={prov.color} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{prov.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {prov.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {prov.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {prov.fields.length} field{prov.fields.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/integrations/connect/${prov.id}`)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
