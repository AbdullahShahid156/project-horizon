"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  integrationsService,
  type Provider,
} from "@/services/integrations";
import {
  ArrowLeft,
  Loader2,
  Link2,
  Globe,
  ShoppingCart,
  Send,
  MessageSquare,
  BarChart3,
} from "lucide-react";

const WORKSPACE_ID = "ws-default";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cms: Globe,
  ecommerce: ShoppingCart,
  marketing: Send,
  productivity: MessageSquare,
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

export default function ConnectIntegrationPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.providerId as string;
  const { addToast } = useToast();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadProvider = useCallback(async () => {
    try {
      const providers = await integrationsService.listProviders();
      const prov = providers.find((p) => p.id === providerId);
      if (!prov) {
        addToast({ title: "Provider not found", variant: "destructive" });
        router.push("/integrations");
        return;
      }
      setProvider(prov);
      setName(prov.name);
      // Initialize credentials with empty values for all fields
      const initial: Record<string, string> = {};
      for (const field of prov.fields) {
        initial[field.key] = "";
      }
      setCredentials(initial);
    } catch {
      addToast({ title: "Failed to load provider", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [providerId, addToast, router]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  const validate = (): boolean => {
    if (!provider) return false;
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    for (const field of provider.fields) {
      if (field.required && !credentials[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = async () => {
    if (!provider || !validate()) return;
    try {
      setConnecting(true);
      const integration = await integrationsService.connect({
        workspace_id: WORKSPACE_ID,
        provider: provider.id,
        name: name.trim(),
        credentials,
      });
      addToast({ title: "Integration connected successfully", variant: "success" });
      router.push(`/integrations/${integration.id}`);
    } catch (err) {
      addToast({
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!provider) return null;

  const CatIcon = CATEGORY_ICONS[provider.category] ?? Globe;

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
          <h1 className="text-2xl font-bold tracking-tight">
            Connect {provider.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to connect to {provider.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`My ${provider.name}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Credentials</h3>
                {provider.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type === "password" ? "password" : field.type === "url" ? "url" : "text"}
                      value={credentials[field.key] ?? ""}
                      onChange={(e) =>
                        setCredentials({ ...credentials, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder ?? ""}
                    />
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    {errors[field.key] && (
                      <p className="text-xs text-red-600">{errors[field.key]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Connect {provider.name}
                </Button>
                <Link href="/integrations">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>About {provider.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${provider.color}20` }}
                >
                  <IconWithColor Icon={CatIcon} color={provider.color} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{provider.category}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
              <Separator />
              <div>
                <h4 className="text-xs font-medium text-muted-foreground">
                  Required Fields
                </h4>
                <ul className="mt-2 space-y-1">
                  {provider.fields
                    .filter((f) => f.required)
                    .map((f) => (
                      <li key={f.key} className="text-sm">
                        {f.label}
                      </li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
