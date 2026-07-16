"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wand2, Loader2, X } from "lucide-react";
import {
  contentStudioService,
  CONTENT_TYPES,
  CONTENT_CATEGORIES,
  type ContentType,
} from "@/services/content-studio";

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "startup", label: "Startup" },
  { value: "technical", label: "Technical" },
  { value: "persuasive", label: "Persuasive" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

const lengthOptions = [
  { value: "short", label: "Short (150-300 words)" },
  { value: "medium", label: "Medium (400-800 words)" },
  { value: "long", label: "Long (1000-2000 words)" },
  { value: "very_long", label: "Very Long (2000-4000 words)" },
];

const goalOptions = [
  { value: "inform", label: "Inform" },
  { value: "persuade", label: "Persuade" },
  { value: "convert", label: "Convert" },
  { value: "engage", label: "Engage" },
  { value: "educate", label: "Educate" },
  { value: "entertain", label: "Entertain" },
];

export default function ContentCreatePage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [formData, setFormData] = useState({
    content_type: "" as ContentType | "",
    title: "",
    business_name: "",
    product: "",
    industry: "",
    target_audience: "",
    language: "English",
    country: "US",
    tone: "professional",
    content_goal: "inform",
    length: "medium",
    keywords: [] as string[],
    competitors: [] as string[],
    call_to_action: "",
    additional_instructions: "",
  });

  const handleAddKeyword = () => {
    if (keyword.trim() && !formData.keywords.includes(keyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()],
      }));
      setKeyword("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kw),
    }));
  };

  const handleGenerate = async () => {
    if (!formData.content_type) {
      setError("Please select a content type");
      return;
    }
    if (!formData.business_name) {
      setError("Please enter a business name");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      const result = await contentStudioService.generateContent({
        workspace_id: "default-workspace",
        content_type: formData.content_type,
        title: formData.title || undefined,
        business_name: formData.business_name,
        product: formData.product || undefined,
        industry: formData.industry || undefined,
        target_audience: formData.target_audience || undefined,
        language: formData.language,
        country: formData.country,
        tone: formData.tone,
        content_goal: formData.content_goal,
        length: formData.length,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        call_to_action: formData.call_to_action || undefined,
        additional_instructions: formData.additional_instructions || undefined,
      });
      router.push(`/content-studio/${result.content_id}/editor`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const contentTypes = Object.entries(CONTENT_TYPES);
  const categories = [...new Set(contentTypes.map(([, v]) => v.category))];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Content</h1>
          <p className="text-muted-foreground">
            Generate AI-powered marketing content in seconds.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Content Type</CardTitle>
          <CardDescription>Select the type of content you want to generate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <div key={cat} className="col-span-full">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {CONTENT_CATEGORIES[cat as keyof typeof CONTENT_CATEGORIES]}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {contentTypes
                    .filter(([, v]) => v.category === cat)
                    .map(([key, val]) => (
                      <Button
                        key={key}
                        variant={formData.content_type === key ? "default" : "outline"}
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-left"
                        onClick={() => setFormData((prev) => ({ ...prev, content_type: key as ContentType }))}
                      >
                        <span className="mr-1">{contentTypeIcons[key] || "📄"}</span>
                        <span className="truncate">{val.label}</span>
                      </Button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Tell us about your business to generate better content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                placeholder="Acme Corp"
                value={formData.business_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, business_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product / Service</Label>
              <Input
                id="product"
                placeholder="AI-powered analytics platform"
                value={formData.product}
                onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Technology"
                value={formData.industry}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="Small business owners"
                value={formData.target_audience}
                onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation Settings</CardTitle>
          <CardDescription>Configure the AI generation parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => setFormData((prev) => ({ ...prev, tone: v }))}>
                <SelectTrigger aria-label="Select tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={formData.length} onValueChange={(v) => setFormData((prev) => ({ ...prev, length: v }))}>
                <SelectTrigger aria-label="Select length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={formData.content_goal} onValueChange={(v) => setFormData((prev) => ({ ...prev, content_goal: v }))}>
                <SelectTrigger aria-label="Select goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={formData.language}
                onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword and press Enter"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                Add
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.keywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1">
                    {kw}
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove keyword ${kw}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta">Call to Action</Label>
            <Input
              id="cta"
              placeholder="Start Free Trial"
              value={formData.call_to_action}
              onChange={(e) => setFormData((prev) => ({ ...prev, call_to_action: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Additional Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Any specific requirements or context for the AI..."
              rows={3}
              value={formData.additional_instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, additional_instructions: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={generating || !formData.content_type || !formData.business_name}
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Content
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

const contentTypeIcons: Record<string, string> = {
  blog_post: "📝",
  product_description: "🏷️",
  landing_page_copy: "🌐",
  website_copy: "🌐",
  service_page: "🏢",
  about_us: "ℹ️",
  email_campaign: "📧",
  cold_email: "✉️",
  newsletter: "📰",
  facebook_ad: "📘",
  instagram_caption: "📸",
  linkedin_post: "💼",
  twitter_post: "🐦",
  google_ad: "🔍",
  youtube_title: "🎬",
  youtube_description: "🎬",
  video_script: "🎥",
  faq: "❓",
  tagline: "✨",
  headline: "📰",
  cta: "👆",
  meta_title: "🏷️",
  meta_description: "📝",
  press_release: "📰",
  case_study: "📊",
  sales_letter: "💰",
};
