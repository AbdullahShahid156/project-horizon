"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { brandStudioService } from "@/services/brand-studio";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Palette,
  Loader2,
  Check,
} from "lucide-react";

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce",
  "Food & Beverage", "Real Estate", "Travel", "Entertainment", "Manufacturing",
  "Retail", "Automotive", "Energy", "Agriculture", "Other",
];

const PERSONALITIES = [
  "Professional", "Friendly", "Luxurious", "Playful", "Bold",
  "Minimalist", "Innovative", "Trustworthy", "Adventurous", "Elegant",
];

const TONES = [
  "Formal", "Casual", "Friendly", "Authoritative", "Humorous",
  "Inspirational", "Technical", "Empathetic", "Energetic", "Calm",
];

export default function BrandCreatePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    target_audience: "",
    brand_personality: "",
    tone_of_voice: "",
    tagline: "",
    mission: "",
    vision: "",
    values: [] as string[],
    primary_color: "#6366F1",
    secondary_color: "#4F46E5",
    accent_color: "#818CF8",
    typography: "",
    logo_style: "",
    icon_style: "",
  });

  const [valueInput, setValueInput] = useState("");

  const handleGenerate = async () => {
    if (!formData.name) {
      addToast({ title: "Error", description: "Company name is required", variant: "destructive" });
      return;
    }
    try {
      setIsGenerating(true);
      const result = await brandStudioService.generateBrand({
        workspace_id: "ws-default",
        name: formData.name,
        industry: formData.industry || undefined,
        target_audience: formData.target_audience || undefined,
        brand_personality: formData.brand_personality || undefined,
        tone_of_voice: formData.tone_of_voice || undefined,
        description: formData.description || undefined,
      });
      setFormData((prev) => ({
        ...prev,
        tagline: result.tagline || prev.tagline,
        mission: result.mission || prev.mission,
        vision: result.vision || prev.vision,
        values: result.values || prev.values,
        primary_color: result.primary_color || prev.primary_color,
        secondary_color: result.secondary_color || prev.secondary_color,
        accent_color: result.accent_color || prev.accent_color,
      }));
      addToast({ title: "Brand generated", description: `Brand "${result.name}" created with AI` });
      router.push(`/brand-studio/${result.brand_id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to generate brand", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      addToast({ title: "Error", description: "Company name is required", variant: "destructive" });
      return;
    }
    try {
      const brand = await brandStudioService.createBrand({
        workspace_id: "ws-default",
        name: formData.name,
        tagline: formData.tagline || undefined,
        industry: formData.industry || undefined,
        description: formData.description || undefined,
        target_audience: formData.target_audience || undefined,
        brand_personality: formData.brand_personality || undefined,
        tone_of_voice: formData.tone_of_voice || undefined,
        mission: formData.mission || undefined,
        vision: formData.vision || undefined,
        values: formData.values.length > 0 ? formData.values : undefined,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        typography: formData.typography || undefined,
        logo_style: formData.logo_style || undefined,
        icon_style: formData.icon_style || undefined,
      });
      addToast({ title: "Brand created", description: `"${brand.name}" has been created` });
      router.push(`/brand-studio/${brand.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to create brand", variant: "destructive" });
    }
  };

  const addValue = () => {
    if (valueInput.trim() && !formData.values.includes(valueInput.trim())) {
      setFormData((prev) => ({ ...prev, values: [...prev.values, valueInput.trim()] }));
      setValueInput("");
    }
  };

  const removeValue = (v: string) => {
    setFormData((prev) => ({ ...prev, values: prev.values.filter((x) => x !== v) }));
  };

  const stepTitles = ["Basic Info", "Brand Identity", "AI Generate"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Brand</h1>
          <p className="text-muted-foreground mt-1">Define your brand identity</p>
        </div>
      </div>

      <div className="flex gap-2">
        {stepTitles.map((title, i) => (
          <div key={title} className={`flex-1 h-2 rounded-full ${i < step ? "bg-primary" : i === step - 1 ? "bg-primary/60" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company Name *</label>
              <Input placeholder="Acme Corp" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Industry</label>
              <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea placeholder="What does your company do?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Audience</label>
              <Textarea placeholder="Who is your target audience?" value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} rows={2} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Brand Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Brand Personality</label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITIES.map((p) => (
                  <Badge key={p} variant={formData.brand_personality === p ? "default" : "outline"} className="cursor-pointer" onClick={() => setFormData({ ...formData, brand_personality: p })}>{p}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tone of Voice</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <Badge key={t} variant={formData.tone_of_voice === t ? "default" : "outline"} className="cursor-pointer" onClick={() => setFormData({ ...formData, tone_of_voice: t })}>{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tagline</label>
              <Input placeholder="Your brand tagline" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Values</label>
              <div className="flex gap-2">
                <Input placeholder="Add a value" value={valueInput} onChange={(e) => setValueInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue())} />
                <Button type="button" variant="outline" onClick={addValue}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.values.map((v) => (
                  <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeValue(v)}>{v} ×</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formData.secondary_color} onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={formData.secondary_color} onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={formData.accent_color} onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={formData.accent_color} onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Typography</label>
              <Input placeholder="e.g. Inter, Roboto" value={formData.typography} onChange={(e) => setFormData({ ...formData, typography: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Generate with AI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Let AI generate your complete brand identity based on the information provided.</p>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="font-medium">{formData.name || "Company Name"}</p>
              {formData.industry && <p className="text-sm text-muted-foreground">Industry: {formData.industry}</p>}
              {formData.brand_personality && <p className="text-sm text-muted-foreground">Personality: {formData.brand_personality}</p>}
              {formData.tone_of_voice && <p className="text-sm text-muted-foreground">Tone: {formData.tone_of_voice}</p>}
              <div className="flex gap-1 mt-2">
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: formData.primary_color }} />
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: formData.secondary_color }} />
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: formData.accent_color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCreate} disabled={isGenerating}>Create Manually</Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate with AI
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
