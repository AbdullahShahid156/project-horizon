"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  FileCode,
  FileJson,
  Archive,
  Loader2,
  Check,
} from "lucide-react";
import { landingPagesService } from "@/services/landing-pages";
import {
  generateLandingPageHTML,
  generateLandingPageMarkdown,
  generateLandingPageJSON,
  generateLandingPageZIP,
} from "@/features/landing-page/utils/export";
import type { LandingPage, LandingPageOutput } from "@/types";

type ExportFormat = "html" | "markdown" | "json" | "zip";

const exportFormats: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
  extension: string;
  mime: string;
}[] = [
  {
    id: "html",
    label: "HTML",
    description: "Standalone HTML file with inline CSS. Ready to host anywhere.",
    icon: FileCode,
    extension: ".html",
    mime: "text/html",
  },
  {
    id: "markdown",
    label: "Markdown",
    description: "Plain text format. Great for docs, READMEs, or CMS import.",
    icon: FileText,
    extension: ".md",
    mime: "text/markdown",
  },
  {
    id: "json",
    label: "JSON",
    description: "Structured data. Use for API integration or re-import later.",
    icon: FileJson,
    extension: ".json",
    mime: "application/json",
  },
  {
    id: "zip",
    label: "ZIP Archive",
    description: "All formats bundled together. HTML + Markdown + JSON + Schema.",
    icon: Archive,
    extension: ".zip",
    mime: "application/zip",
  },
];

export default function LandingPageExportPage() {
  const params = useParams();
  const router = useRouter();
  const lpId = params.landingPageId as string;

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [content, setContent] = useState<LandingPageOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exported, setExported] = useState<ExportFormat | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const lp = await landingPagesService.getById(lpId);
        setLandingPage(lp);
        setContent(lp.aiResponse || null);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lpId]);

  const handleExport = async (format: ExportFormat) => {
    if (!content) return;
    setExporting(format);
    setExported(null);

    try {
      const name = (content.title || "landing-page")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let blob: Blob;
      let filename: string;

      switch (format) {
        case "html":
          blob = new Blob([generateLandingPageHTML(content)], { type: "text/html" });
          filename = `${name}.html`;
          break;
        case "markdown":
          blob = new Blob([generateLandingPageMarkdown(content)], { type: "text/markdown" });
          filename = `${name}.md`;
          break;
        case "json":
          blob = new Blob([generateLandingPageJSON(content)], { type: "application/json" });
          filename = `${name}.json`;
          break;
        case "zip":
          blob = await generateLandingPageZIP(content);
          filename = `${name}.zip`;
          break;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setExported(format);
      setTimeout(() => setExported(null), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No content to export.</p>
        <Link href="/landing-pages">
          <Button variant="outline">Back to Landing Pages</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/landing-pages/${lpId}/editor`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Export Landing Page</h1>
          <p className="text-muted-foreground">
            {landingPage?.name} — Choose a format to download.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {exportFormats.map((format, i) => {
          const Icon = format.icon;
          const isExporting = exporting === format.id;
          const isExported = exported === format.id;

          return (
            <motion.div
              key={format.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{format.extension}</Badge>
                  </div>
                  <CardTitle className="mt-4">{format.label}</CardTitle>
                  <CardDescription>{format.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleExport(format.id)}
                    disabled={isExporting}
                    variant={isExported ? "default" : "default"}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : isExported ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Downloaded!
                      </>
                    ) : (
                      <>
                        Download {format.label}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Link href={`/landing-pages/${lpId}/preview`}>
          <Button variant="outline">Preview</Button>
        </Link>
        <Link href={`/landing-pages/${lpId}/editor`}>
          <Button>Back to Editor</Button>
        </Link>
      </div>
    </div>
  );
}
