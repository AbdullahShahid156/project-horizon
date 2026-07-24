"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, Hash, RefreshCw, Copy, Check } from "lucide-react";
import type { LandingPageSeo } from "@/types";

interface SeoPanelProps {
  seo: LandingPageSeo;
  onUpdate: (seo: LandingPageSeo) => void;
}

export function SeoPanel({ seo, onUpdate }: SeoPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const titleLength = seo.title?.length || 0;
  const descriptionLength = seo.description?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4" />
          SEO Settings
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const title = seo.title || "";
            const description = seo.description || "";
            onUpdate({
              ...seo,
              ogTitle: seo.ogTitle || title,
              ogDescription: seo.ogDescription || description,
            });
          }}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Sync OG Tags
        </Button>
      </div>

      {/* Meta Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Meta Title</label>
          <span
            className={`text-xs ${
              titleLength > 60
                ? "text-destructive"
                : titleLength > 50
                ? "text-yellow-600"
                : "text-muted-foreground"
            }`}
          >
            {titleLength}/60
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            value={seo.title || ""}
            onChange={(e) => onUpdate({ ...seo, title: e.target.value })}
            placeholder="Page title for search engines"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => handleCopy(seo.title || "", "title")}
          >
            {copiedField === "title" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="rounded-lg bg-muted p-2 text-xs">
          <span className="text-muted-foreground">Preview: </span>
          <span className="font-medium">
            {seo.title || "Page Title"}
          </span>
          <span className="text-blue-600 block">
            https://yoursite.com
          </span>
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Meta Description</label>
          <span
            className={`text-xs ${
              descriptionLength > 160
                ? "text-destructive"
                : descriptionLength > 140
                ? "text-yellow-600"
                : "text-muted-foreground"
            }`}
          >
            {descriptionLength}/160
          </span>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={seo.description || ""}
            onChange={(e) => onUpdate({ ...seo, description: e.target.value })}
            placeholder="Brief description for search results"
            rows={2}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => handleCopy(seo.description || "", "description")}
          >
            {copiedField === "description" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="rounded-lg bg-muted p-2 text-xs">
          <div className="font-medium text-green-700">
            {seo.title || "Page Title"}
          </div>
          <div className="text-muted-foreground">
            https://yoursite.com
          </div>
          <div className="text-muted-foreground mt-1">
            {seo.description?.slice(0, 160) || "Meta description will appear here..."}
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <Hash className="h-3 w-3" />
          Keywords
        </label>
        <Input
          value={seo.keywords?.join(", ") || ""}
          onChange={(e) =>
            onUpdate({
              ...seo,
              keywords: e.target.value
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean),
            })
          }
          placeholder="keyword1, keyword2, keyword3"
        />
        <div className="flex flex-wrap gap-1">
          {seo.keywords?.map((kw, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {kw}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Open Graph */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Open Graph (Social)</h4>

        <div className="space-y-2">
          <label className="text-sm font-medium">OG Title</label>
          <Input
            value={seo.ogTitle || ""}
            onChange={(e) => onUpdate({ ...seo, ogTitle: e.target.value })}
            placeholder="Title for social media sharing"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">OG Description</label>
          <Textarea
            value={seo.ogDescription || ""}
            onChange={(e) => onUpdate({ ...seo, ogDescription: e.target.value })}
            placeholder="Description for social media sharing"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">OG Image URL</label>
          <Input
            value={seo.ogImage || ""}
            onChange={(e) => onUpdate({ ...seo, ogImage: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <Separator />

      {/* Twitter Card */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Twitter Card</h4>
        <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              summary_large_image
            </Badge>
          </div>
          <div className="font-medium mt-2">
            {seo.ogTitle || seo.title || "Page Title"}
          </div>
          <div className="text-muted-foreground">
            {seo.ogDescription || seo.description || "Description..."}
          </div>
        </div>
      </div>
    </div>
  );
}
