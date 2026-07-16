"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, FileText, Code, FileJson, Hash } from "lucide-react";
import { contentStudioService, type ContentItem } from "@/services/content-studio";

const exportFormats = [
  {
    format: "html",
    label: "HTML",
    description: "Web-ready HTML file with proper structure",
    icon: Code,
    mimeType: "text/html",
  },
  {
    format: "markdown",
    label: "Markdown",
    description: "Markdown format for documentation and blogs",
    icon: FileText,
    mimeType: "text/markdown",
  },
  {
    format: "txt",
    label: "Plain Text",
    description: "Simple text file without formatting",
    icon: Hash,
    mimeType: "text/plain",
  },
  {
    format: "json",
    label: "JSON",
    description: "Structured data format for programmatic use",
    icon: FileJson,
    mimeType: "application/json",
  },
];

export default function ContentExportPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const data = await contentStudioService.getContent(contentId);
      setItem(data ?? null);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleExport = async (format: string) => {
    try {
      setExporting(format);
      const result = await contentStudioService.exportContent(contentId, format);
      const blob = new Blob([result?.content ?? ""], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result?.filename ?? "export.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Export Content</h1>
          <p className="text-muted-foreground">
            {item?.title || "Export your content in multiple formats."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportFormats.map((fmt) => {
          const Icon = fmt.icon;
          return (
            <Card key={fmt.format} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleExport(fmt.format)}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{fmt.label}</h3>
                  <p className="text-sm text-muted-foreground">{fmt.description}</p>
                </div>
                {exporting === fmt.format ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Download className="h-5 w-5 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
