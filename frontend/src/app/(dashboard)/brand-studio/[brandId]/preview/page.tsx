"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { brandStudioService, type Brand } from "@/services/brand-studio";
import { ArrowLeft, Edit, Palette, Type, MessageSquare, Layout } from "lucide-react";

export default function BrandPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrand = useCallback(async () => {
    try {
      const data = await brandStudioService.getBrand(brandId);
      setBrand(data ?? null);
    } catch {
      router.push("/brand-studio");
    } finally {
      setLoading(false);
    }
  }, [brandId, router]);

  useEffect(() => { fetchBrand(); }, [fetchBrand]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!brand) return null;

  const sampleHeadings = ["Welcome to Our Platform", "Built for Innovation", "Join the Future"];
  const sampleButtons = ["Get Started", "Learn More", "Contact Us", "Sign Up Free"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">{brand.name} — Brand Preview</h1>
            <p className="text-muted-foreground mt-1">{brand.tagline}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/brand-studio/${brandId}`)}><Edit className="mr-2 h-4 w-4" /> Edit Brand</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Layout className="h-4 w-4" /> Brand Identity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 rounded-xl text-center" style={{ backgroundColor: brand.primary_color, color: "#fff" }}>
                <h2 className="text-4xl font-bold mb-2">{brand.name}</h2>
                <p className="text-xl opacity-90">{brand.tagline}</p>
                {brand.brand_keywords && (
                  <div className="flex justify-center gap-2 mt-4">
                    {(brand.brand_keywords ?? []).slice(0, 3).map((kw: string) => (
                      <Badge key={kw} className="bg-white/20 text-white border-white/30">{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-4 w-4" /> Typography & Buttons</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">Sample Headings</p>
                <div className="space-y-3">
                  {sampleHeadings.map((h, i) => (
                    <div key={i} className="p-4 border rounded-lg" style={{ borderLeftColor: brand.primary_color, borderLeftWidth: 4 }}>
                      <h3 className="text-xl font-bold" style={{ color: brand.primary_color }}>{h}</h3>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">Sample Buttons</p>
                <div className="flex flex-wrap gap-3">
                  {sampleButtons.map((b, i) => (
                    <button
                      key={i}
                      className="px-6 py-2.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: i === 0 ? brand.primary_color : i === 1 ? brand.secondary_color : brand.accent_color }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">Example Card</p>
                <div className="border rounded-xl overflow-hidden max-w-sm">
                  <div className="h-32" style={{ backgroundColor: brand.secondary_color, opacity: 0.2 }} />
                  <div className="p-4">
                    <h4 className="font-bold text-lg">Feature Highlight</h4>
                    <p className="text-muted-foreground text-sm mt-1">This is a sample card demonstrating your brand colors and typography in action.</p>
                    <button className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: brand.accent_color }}>Learn More</button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {brand.brand_guidelines && (
            <Card>
              <CardHeader><CardTitle>Brand Guidelines</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">{brand.brand_guidelines}</div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Color Palette</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-full h-16 rounded-lg border" style={{ backgroundColor: brand.primary_color }} />
                  <p className="text-xs font-medium mt-2">Primary</p>
                  <p className="text-xs text-muted-foreground">{brand.primary_color}</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-16 rounded-lg border" style={{ backgroundColor: brand.secondary_color }} />
                  <p className="text-xs font-medium mt-2">Secondary</p>
                  <p className="text-xs text-muted-foreground">{brand.secondary_color}</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-16 rounded-lg border" style={{ backgroundColor: brand.accent_color }} />
                  <p className="text-xs font-medium mt-2">Accent</p>
                  <p className="text-xs text-muted-foreground">{brand.accent_color}</p>
                </div>
              </div>
              {brand.color_palette && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(brand.color_palette).map(([name, hex]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: hex }} />
                      <div>
                        <p className="text-xs font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Brand Voice</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {brand.tone_of_voice && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Tone of Voice</p>
                  <Badge variant="secondary">{brand.tone_of_voice}</Badge>
                </div>
              )}
              {brand.brand_personality && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Personality</p>
                  <Badge variant="secondary">{brand.brand_personality}</Badge>
                </div>
              )}
              {brand.brand_voice && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Voice Description</p>
                  <p className="text-sm">{brand.brand_voice}</p>
                </div>
              )}
              {brand.elevator_pitch && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Elevator Pitch</p>
                  <p className="text-sm italic">&ldquo;{brand.elevator_pitch}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Brand Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {brand.industry && <p><span className="text-muted-foreground">Industry:</span> {brand.industry}</p>}
              {brand.typography && <p><span className="text-muted-foreground">Typography:</span> {brand.typography}</p>}
              {brand.logo_style && <p><span className="text-muted-foreground">Logo Style:</span> {brand.logo_style}</p>}
              {brand.icon_style && <p><span className="text-muted-foreground">Icon Style:</span> {brand.icon_style}</p>}
            </CardContent>
          </Card>

          {brand.values && brand.values.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Values</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brand.values.map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand.primary_color }} />
                      <span className="text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {brand.font_pairings && brand.font_pairings.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Font Pairings</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brand.font_pairings.map((fp, i) => (
                    <div key={i} className="p-2 border rounded text-sm">
                      <span className="font-medium">{fp.heading}</span>
                      <span className="text-muted-foreground"> + </span>
                      <span>{fp.body}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
