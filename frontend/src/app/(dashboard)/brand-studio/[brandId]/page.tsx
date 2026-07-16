"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { brandStudioService, type Brand, type BrandVersion } from "@/services/brand-studio";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  History,
  Sparkles,
  Palette,
  Tag,
  FileText,
  Globe,
  Plus,
  RotateCcw,
} from "lucide-react";

export default function BrandEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const brandId = params.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<BrandVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [optimizing, setOptimizing] = useState<string | null>(null);

  const fetchBrand = useCallback(async () => {
    try {
      const data = await brandStudioService.getBrand(brandId);
      setBrand(data ?? null);
    } catch {
      addToast({ title: "Error", description: "Failed to load brand", variant: "destructive" });
      router.push("/brand-studio");
    } finally {
      setLoading(false);
    }
  }, [brandId, addToast, router]);

  const fetchVersions = useCallback(async () => {
    try {
      setVersionsLoading(true);
      const data = await brandStudioService.listVersions(brandId);
      setVersions(data ?? []);
    } catch { /* ignore */ } finally {
      setVersionsLoading(false);
    }
  }, [brandId]);

  useEffect(() => { fetchBrand(); fetchVersions(); }, [fetchBrand, fetchVersions]);

  const handleSave = async () => {
    if (!brand) return;
    try {
      setSaving(true);
      await brandStudioService.updateBrand(brandId, {
        name: brand.name,
        tagline: brand.tagline ?? undefined,
        industry: brand.industry ?? undefined,
        description: brand.description ?? undefined,
        target_audience: brand.target_audience ?? undefined,
        brand_personality: brand.brand_personality ?? undefined,
        tone_of_voice: brand.tone_of_voice ?? undefined,
        mission: brand.mission ?? undefined,
        vision: brand.vision ?? undefined,
        values: brand.values ?? undefined,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        accent_color: brand.accent_color,
        typography: brand.typography ?? undefined,
        logo_style: brand.logo_style ?? undefined,
        icon_style: brand.icon_style ?? undefined,
        change_summary: changeSummary || undefined,
      });
      setChangeSummary("");
      fetchVersions();
      addToast({ title: "Brand saved", description: "Changes saved successfully" });
    } catch {
      addToast({ title: "Error", description: "Failed to save brand", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOptimize = async (field: string) => {
    if (!brand) return;
    try {
      setOptimizing(field);
      const result = await brandStudioService.optimizeBrandField({
        brand_id: brandId,
        action: "rewrite",
        field,
      });
      setBrand((prev) => prev ? { ...prev, [field]: result.optimized } : prev);
      addToast({ title: "Field optimized", description: `${field} has been improved` });
    } catch {
      addToast({ title: "Error", description: "Failed to optimize field", variant: "destructive" });
    } finally {
      setOptimizing(null);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const restored = await brandStudioService.restoreVersion(brandId, versionId);
      setBrand(restored ?? null);
      fetchVersions();
      addToast({ title: "Version restored" });
    } catch {
      addToast({ title: "Error", description: "Failed to restore version", variant: "destructive" });
    }
  };

  const update = (field: string, value: unknown) => {
    setBrand((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const addValue = () => {
    if (valueInput.trim() && brand && !brand.values?.includes(valueInput.trim())) {
      update("values", [...(brand.values || []), valueInput.trim()]);
      setValueInput("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <p className="text-muted-foreground mt-1">Version {brand.current_version}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/brand-studio/${brandId}/preview`)}><Eye className="mr-2 h-4 w-4" /> Preview</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      <div className="flex gap-1 items-center">
        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: brand.primary_color }} />
        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: brand.secondary_color }} />
        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: brand.accent_color }} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details"><FileText className="mr-1 h-3 w-3" /> Details</TabsTrigger>
          <TabsTrigger value="identity"><Palette className="mr-1 h-3 w-3" /> Identity</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="mr-1 h-3 w-3" /> AI Generated</TabsTrigger>
          <TabsTrigger value="versions"><History className="mr-1 h-3 w-3" /> Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Company Name</label>
                <Input value={brand.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tagline</label>
                <div className="flex gap-2">
                  <Input value={brand.tagline || ""} onChange={(e) => update("tagline", e.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => handleOptimize("tagline")} disabled={optimizing === "tagline"}>
                    {optimizing === "tagline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Industry</label>
                <Input value={brand.industry || ""} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={brand.description || ""} onChange={(e) => update("description", e.target.value)} rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Audience</label>
                <Textarea value={brand.target_audience || ""} onChange={(e) => update("target_audience", e.target.value)} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mission</label>
                <div className="flex gap-2">
                  <Textarea value={brand.mission || ""} onChange={(e) => update("mission", e.target.value)} rows={2} />
                  <Button variant="outline" size="sm" onClick={() => handleOptimize("mission")} disabled={optimizing === "mission"}>
                    {optimizing === "mission" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Vision</label>
                <div className="flex gap-2">
                  <Textarea value={brand.vision || ""} onChange={(e) => update("vision", e.target.value)} rows={2} />
                  <Button variant="outline" size="sm" onClick={() => handleOptimize("vision")} disabled={optimizing === "vision"}>
                    {optimizing === "vision" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Values</label>
                <div className="flex gap-2">
                  <Input placeholder="Add a value" value={valueInput} onChange={(e) => setValueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue())} />
                  <Button type="button" variant="outline" onClick={addValue}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(brand.values || []).map((v) => (
                    <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => update("values", brand.values?.filter((x) => x !== v))}>{v} ×</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(["primary_color", "secondary_color", "accent_color"] as const).map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium mb-1 block">{field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={brand[field]} onChange={(e) => update(field, e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <Input value={brand[field]} onChange={(e) => update(field, e.target.value)} />
                  </div>
                </div>
              ))}
              {brand.color_palette && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Palette</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(brand.color_palette).map(([name, hex]) => (
                      <div key={name} className="text-center">
                        <div className="w-12 h-12 rounded-lg border" style={{ backgroundColor: hex }} />
                        <p className="text-xs mt-1">{name}</p>
                        <p className="text-xs text-muted-foreground">{hex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Typography & Style</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Typography</label>
                <Input value={brand.typography || ""} onChange={(e) => update("typography", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Logo Style</label>
                <Input value={brand.logo_style || ""} onChange={(e) => update("logo_style", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Icon Style</label>
                <Input value={brand.icon_style || ""} onChange={(e) => update("icon_style", e.target.value)} />
              </div>
              {brand.font_pairings && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Font Pairings</label>
                  <div className="space-y-2">
                    {brand.font_pairings.map((fp, i) => (
                      <div key={i} className="p-2 border rounded flex gap-4 text-sm">
                        <span className="font-medium">{fp.heading}</span>
                        <span className="text-muted-foreground">+</span>
                        <span>{fp.body}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          {[
            { key: "brand_summary", label: "Brand Summary" },
            { key: "brand_voice", label: "Brand Voice" },
            { key: "elevator_pitch", label: "Elevator Pitch" },
            { key: "usp", label: "Unique Selling Proposition" },
            { key: "brand_guidelines", label: "Brand Guidelines" },
          ].map(({ key, label }) => (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{label}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleOptimize(key)} disabled={optimizing === key}>
                  {optimizing === key ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />} Optimize
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea value={(brand as unknown as Record<string, string>)[key] || ""} onChange={(e) => update(key, e.target.value)} rows={4} />
              </CardContent>
            </Card>
          ))}
          {brand.tagline_suggestions && (
            <Card>
              <CardHeader><CardTitle>Tagline Suggestions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brand.tagline_suggestions.map((t: string, i: number) => (
                    <div key={i} className="p-2 border rounded flex justify-between items-center">
                      <span>{t}</span>
                      <Button variant="ghost" size="sm" onClick={() => update("tagline", t)}>Use</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {brand.brand_keywords && (
            <Card>
              <CardHeader><CardTitle>Brand Keywords</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {brand.brand_keywords.map((kw: string) => (
                    <Badge key={kw} variant="secondary">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {brand.icon_suggestions && (
            <Card>
              <CardHeader><CardTitle>Icon Style Suggestions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brand.icon_suggestions.map((s: string, i: number) => (
                    <div key={i} className="p-2 border rounded text-sm">{s}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Version History</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Change summary" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} className="w-64" />
                <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-3 w-3" /> Save & Version</Button>
              </div>
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : versions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No versions yet</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Version {v.version_number}</p>
                        <p className="text-sm text-muted-foreground">{v.change_summary || "No description"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRestoreVersion(v.id)}><RotateCcw className="mr-1 h-3 w-3" /> Restore</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
