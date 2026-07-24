"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Eye,
  Save,
  Undo2,
  Redo2,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  History,
  LayoutList,
  ImageIcon,
  Globe,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { landingPagesService } from "@/services/landing-pages";
import { COPY_ACTIONS } from "@/constants/landing-page";
import { SeoPanel } from "@/features/landing-page/components/seo-panel";
import { SectionReorder } from "@/features/landing-page/components/section-reorder";
import { MediaPanel } from "@/features/landing-page/components/media-panel";
import type { LandingPage, LandingPageOutput } from "@/types";

const LandingPagePreview = dynamic(
  () => import("@/features/landing-page/components/live-preview").then((mod) => mod.LandingPagePreview),
  { ssr: false, loading: () => <div className="p-4 text-muted-foreground text-sm">Loading preview...</div> }
);

type PreviewDevice = "desktop" | "tablet" | "mobile";

const SECTION_DEFS = [
  { id: "hero", label: "Hero" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "benefits", label: "Benefits" },
  { id: "features", label: "Features" },
  { id: "howItWorks", label: "How It Works" },
  { id: "testimonials", label: "Testimonials" },
  { id: "statistics", label: "Statistics" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "finalCta", label: "Final CTA" },
  { id: "contact", label: "Contact" },
  { id: "seo", label: "SEO" },
];

export default function LandingPageEditorPage() {
  const params = useParams();
  const lpId = params.landingPageId as string;

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [content, setContent] = useState<LandingPageOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [improvingField, setImprovingField] = useState<string | null>(null);
  const [history, setHistory] = useState<LandingPageOutput[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeSection] = useState("hero");
  const [sidebarTab, setSidebarTab] = useState<"sections" | "seo" | "media">("sections");
  const [sectionOrder, setSectionOrder] = useState(() =>
    SECTION_DEFS.map((s) => ({ ...s, enabled: true }))
  );
  const [mediaItems, setMediaItems] = useState<
    { id: string; name: string; url: string; type: "image" | "icon" | "video"; size?: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const lp = await landingPagesService.getById(lpId);
        setLandingPage(lp ?? null);
        const c = lp?.aiResponse ?? ({} as LandingPageOutput);
        setContent(c);
        setHistory([c]);
        setHistoryIndex(0);
      } catch (err) {
        console.error("Failed to load:", err);
        setError(err instanceof Error ? err.message : "Failed to load landing page. It may have been deleted or the server restarted.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lpId]);

  const { } = useLandingPageAutoSave(lpId, content, 30000);

  const pushHistory = (newContent: LandingPageOutput) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1] ?? null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1] ?? null);
    }
  };

  const updateContent = (updater: (prev: LandingPageOutput) => LandingPageOutput) => {
    if (!content) return;
    const newContent = updater(content);
    setContent(newContent);
    pushHistory(newContent);
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await landingPagesService.update(lpId, {
        content,
        change_summary: "Manual save",
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImproveCopy = async (
    text: string,
    action: string,
    callback: (improved: string) => void
  ) => {
    setImprovingField(text);
    try {
      const result = await landingPagesService.improveCopy({
        text,
        action,
        tone: landingPage?.generationPrompt?.brand_voice,
        context: landingPage?.generationPrompt?.description,
      });
      callback(result?.improved ?? text);
    } catch (err) {
      console.error("Failed to improve:", err);
    } finally {
      setImprovingField(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content || error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Landing page not found."}</p>
        <div className="flex gap-3">
          <Link href="/landing-pages">
            <Button variant="outline">Back to Landing Pages</Button>
          </Link>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const deviceWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/landing-pages">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-sm font-semibold">{landingPage?.name || "Landing Page"}</h2>
            <p className="text-xs text-muted-foreground">v{landingPage?.currentVersion || 1}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md" role="group" aria-label="Preview device selector">
            {(["desktop", "tablet", "mobile"] as PreviewDevice[]).map((d) => (
              <Button
                key={d}
                variant={device === d ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => setDevice(d)}
                aria-label={`${d} view`}
                aria-pressed={device === d}
              >
                {d === "desktop" && <Monitor className="h-4 w-4" />}
                {d === "tablet" && <Tablet className="h-4 w-4" />}
                {d === "mobile" && <Smartphone className="h-4 w-4" />}
              </Button>
            ))}
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1} aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
            Save
          </Button>

          <Link href={`/landing-pages/${lpId}/preview`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Button>
          </Link>

          <Link href={`/landing-pages/${lpId}/versions`}>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Version History">
              <History className="h-4 w-4" />
            </Button>
          </Link>

          <Link href={`/landing-pages/${lpId}/export`}>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r overflow-y-auto">
          <div className="p-3">
            <div className="flex gap-1 mb-3" role="tablist" aria-label="Editor sidebar tabs">
              <Button
                variant={sidebarTab === "sections" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setSidebarTab("sections")}
              >
                <LayoutList className="h-3 w-3 mr-1" />
                Sections
              </Button>
              <Button
                variant={sidebarTab === "seo" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setSidebarTab("seo")}
              >
                <Globe className="h-3 w-3 mr-1" />
                SEO
              </Button>
              <Button
                variant={sidebarTab === "media" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setSidebarTab("media")}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Media
              </Button>
            </div>

            {sidebarTab === "sections" && (
              <SectionReorder
                sections={sectionOrder}
                onReorder={setSectionOrder}
                onToggle={(id, enabled) =>
                  setSectionOrder((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, enabled } : s))
                  )
                }
                onRemove={(id) =>
                  setSectionOrder((prev) => prev.filter((s) => s.id !== id))
                }
              />
            )}

            {sidebarTab === "seo" && (
              <SeoPanel
                seo={content.seo || { title: "", description: "", keywords: [] }}
                onUpdate={(seo) =>
                  updateContent((prev) => ({ ...prev, seo }))
                }
              />
            )}

            {sidebarTab === "media" && (
              <MediaPanel
                media={mediaItems}
                onMediaAdd={(item) =>
                  setMediaItems((prev) => [...prev, item])
                }
                onMediaRemove={(id) =>
                  setMediaItems((prev) => prev.filter((m) => m.id !== id))
                }
                onMediaReorder={setMediaItems}
                onUrlSelect={(url) => {
                  if (activeSection === "hero") {
                    updateContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, imageUrl: url },
                    }));
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <div className="mx-auto" style={{ maxWidth: deviceWidths[device] }}>
            <Card className="shadow-lg">
              <CardContent className="p-6 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {activeSection === "hero" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Hero Section</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Headline</label>
                          <div className="flex gap-2">
                            <Input
                              value={content.hero?.headline || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, headline: e.target.value },
                                }))
                              }
                            />
                            <CopyActionButtons
                              text={content.hero?.headline || ""}
                              field="hero.headline"
                              onCopy={handleCopy}
                              onImprove={handleImproveCopy}
                              copiedField={copiedField}
                              improvingField={improvingField}
                              onUpdate={(text) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, headline: text },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Subheadline</label>
                          <div className="flex gap-2">
                            <Textarea
                              value={content.hero?.subheadline || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, subheadline: e.target.value },
                                }))
                              }
                              rows={2}
                            />
                            <CopyActionButtons
                              text={content.hero?.subheadline || ""}
                              field="hero.subheadline"
                              onCopy={handleCopy}
                              onImprove={handleImproveCopy}
                              copiedField={copiedField}
                              improvingField={improvingField}
                              onUpdate={(text) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, subheadline: text },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Primary CTA</label>
                            <Input
                              value={content.hero?.primaryCta || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, primaryCta: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Secondary CTA</label>
                            <Input
                              value={content.hero?.secondaryCta || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, secondaryCta: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "problem" && (
                      <SectionEditor
                        title="Problem Statement"
                        section={content.problem}
                        onUpdate={(section) =>
                          updateContent((prev) => ({ ...prev, problem: section }))
                        }
                        onCopy={handleCopy}
                        onImprove={handleImproveCopy}
                        copiedField={copiedField}
                        improvingField={improvingField}
                      />
                    )}

                    {activeSection === "solution" && (
                      <SectionEditor
                        title="Solution"
                        section={content.solution}
                        onUpdate={(section) =>
                          updateContent((prev) => ({ ...prev, solution: section }))
                        }
                        onCopy={handleCopy}
                        onImprove={handleImproveCopy}
                        copiedField={copiedField}
                        improvingField={improvingField}
                      />
                    )}

                    {activeSection === "benefits" && (
                      <ListEditor
                        title="Benefits"
                        items={content.benefits || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, benefits: items }))
                        }
                      />
                    )}

                    {activeSection === "features" && (
                      <ListEditor
                        title="Features"
                        items={content.features || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, features: items }))
                        }
                      />
                    )}

                    {activeSection === "howItWorks" && (
                      <HowItWorksEditor
                        section={content.howItWorks}
                        onUpdate={(section) =>
                          updateContent((prev) => ({ ...prev, howItWorks: section }))
                        }
                      />
                    )}

                    {activeSection === "testimonials" && (
                      <TestimonialsEditor
                        items={content.testimonials || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, testimonials: items }))
                        }
                      />
                    )}

                    {activeSection === "statistics" && (
                      <StatsEditor
                        items={content.statistics || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, statistics: items }))
                        }
                      />
                    )}

                    {activeSection === "pricing" && (
                      <PricingEditor
                        items={content.pricing || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, pricing: items }))
                        }
                      />
                    )}

                    {activeSection === "faq" && (
                      <FAQEditor
                        items={content.faq || []}
                        onUpdate={(items) =>
                          updateContent((prev) => ({ ...prev, faq: items }))
                        }
                      />
                    )}

                    {activeSection === "finalCta" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Final CTA</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Headline</label>
                          <Input
                            value={content.finalCta?.headline || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                finalCta: { ...prev.finalCta, headline: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Subheadline</label>
                          <Textarea
                            value={content.finalCta?.subheadline || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                finalCta: { ...prev.finalCta, subheadline: e.target.value },
                              }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CTA Button</label>
                          <Input
                            value={content.finalCta?.cta || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                finalCta: { ...prev.finalCta, cta: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}

                    {activeSection === "contact" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Contact</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Headline</label>
                          <Input
                            value={content.contact?.headline || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                contact: { ...prev.contact, headline: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <Textarea
                            value={content.contact?.description || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                contact: { ...prev.contact, description: e.target.value },
                              }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              value={content.contact?.email || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  contact: { ...prev.contact, email: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                              value={content.contact?.phone || ""}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  contact: { ...prev.contact, phone: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === "seo" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">SEO</h3>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meta Title</label>
                          <Input
                            value={content.seo?.title || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                seo: { ...prev.seo, title: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meta Description</label>
                          <Textarea
                            value={content.seo?.description || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                seo: { ...prev.seo, description: e.target.value },
                              }))
                            }
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Keywords (comma-separated)</label>
                          <Input
                            value={content.seo?.keywords?.join(", ") || ""}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                seo: {
                                  ...prev.seo,
                                  keywords: e.target.value.split(",").map((k) => k.trim()),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-80 border-l overflow-y-auto bg-background p-4">
          <h3 className="text-sm font-semibold mb-3">Live Preview</h3>
          <div
            className="rounded-lg border overflow-hidden bg-white"
            style={{ minHeight: 400 }}
          >
            <LandingPagePreview content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyActionButtons({
  text,
  field,
  onCopy,
  onImprove,
  copiedField,
  improvingField,
  onUpdate,
}: {
  text: string;
  field: string;
  onCopy: (text: string, field: string) => void;
  onImprove: (text: string, action: string, cb: (s: string) => void) => void;
  copiedField: string | null;
  improvingField: string | null;
  onUpdate: (text: string) => void;
}) {
  const isCopied = copiedField === field;
  const isImproving = improvingField === text;

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onCopy(text, field)}
        aria-label={isCopied ? "Copied" : "Copy text"}
      >
        {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isImproving} aria-label="Improve copy">
            {isImproving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {COPY_ACTIONS.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={() =>
                onImprove(text, action.id, onUpdate)
              }
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SectionEditor({
  title,
  section,
  onUpdate,
}: {
  title: string;
  section: any;
  onUpdate: (s: any) => void;
}) {
  if (!section) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium">Headline</label>
        <Input
          value={section.headline || ""}
          onChange={(e) => onUpdate({ ...section, headline: e.target.value })}
        />
      </div>
      {section.description !== undefined && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={section.description || ""}
            onChange={(e) => onUpdate({ ...section, description: e.target.value })}
            rows={3}
          />
        </div>
      )}
      {section.points && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Points</label>
          {section.points.map((p: string, i: number) => (
            <div key={i} className="flex gap-2">
              <Input
                value={p}
                onChange={(e) => {
                  const newPoints = [...section.points];
                  newPoints[i] = e.target.value;
                  onUpdate({ ...section, points: newPoints });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  const newPoints = section.points.filter((_: string, j: number) => j !== i);
                  onUpdate({ ...section, points: newPoints });
                }}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onUpdate({ ...section, points: [...(section.points || []), ""] })
            }
          >
            Add Point
          </Button>
        </div>
      )}
      {section.highlights && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Highlights</label>
          {section.highlights.map((h: string, i: number) => (
            <div key={i} className="flex gap-2">
              <Input
                value={h}
                onChange={(e) => {
                  const newHighlights = [...section.highlights];
                  newHighlights[i] = e.target.value;
                  onUpdate({ ...section, highlights: newHighlights });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  const newHighlights = section.highlights.filter((_: string, j: number) => j !== i);
                  onUpdate({ ...section, highlights: newHighlights });
                }}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onUpdate({ ...section, highlights: [...(section.highlights || []), ""] })
            }
          >
            Add Highlight
          </Button>
        </div>
      )}
    </div>
  );
}

function ListEditor({
  title,
  items,
  onUpdate,
}: {
  title: string;
  items: { title: string; description: string; icon?: string }[];
  onUpdate: (items: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <Input
                value={item.title}
                placeholder="Title"
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[i] = { ...newItems[i], title: e.target.value };
                  onUpdate(newItems);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={item.description}
              placeholder="Description"
              rows={2}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = { ...newItems[i], description: e.target.value };
                onUpdate(newItems);
              }}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUpdate([...items, { title: "", description: "" }])}
      >
        Add {title.slice(0, -1) || title}
      </Button>
    </div>
  );
}

function HowItWorksEditor({
  section,
  onUpdate,
}: {
  section: any;
  onUpdate: (s: any) => void;
}) {
  if (!section) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">How It Works</h3>
      <div className="space-y-2">
        <label className="text-sm font-medium">Headline</label>
        <Input
          value={section.headline || ""}
          onChange={(e) => onUpdate({ ...section, headline: e.target.value })}
        />
      </div>
      <div className="space-y-3">
        {(section.steps || []).map((step: any, i: number) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <Badge>Step {step.number || i + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const newSteps = section.steps.filter((_: any, j: number) => j !== i);
                    onUpdate({ ...section, steps: newSteps });
                  }}
                >
                  ×
                </Button>
              </div>
              <Input
                value={step.title || ""}
                placeholder="Step title"
                onChange={(e) => {
                  const newSteps = [...section.steps];
                  newSteps[i] = { ...newSteps[i], title: e.target.value };
                  onUpdate({ ...section, steps: newSteps });
                }}
              />
              <Textarea
                value={step.description || ""}
                placeholder="Step description"
                rows={2}
                onChange={(e) => {
                  const newSteps = [...section.steps];
                  newSteps[i] = { ...newSteps[i], description: e.target.value };
                  onUpdate({ ...section, steps: newSteps });
                }}
              />
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onUpdate({
              ...section,
              steps: [
                ...(section.steps || []),
                { number: (section.steps?.length || 0) + 1, title: "", description: "" },
              ],
            })
          }
        >
          Add Step
        </Button>
      </div>
    </div>
  );
}

function TestimonialsEditor({
  items,
  onUpdate,
}: {
  items: any[];
  onUpdate: (items: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Testimonials</h3>
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  value={item.name || ""}
                  placeholder="Name"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = { ...newItems[i], name: e.target.value };
                    onUpdate(newItems);
                  }}
                />
                <Input
                  value={item.role || ""}
                  placeholder="Role"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = { ...newItems[i], role: e.target.value };
                    onUpdate(newItems);
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={item.quote || ""}
              placeholder="Testimonial quote"
              rows={2}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = { ...newItems[i], quote: e.target.value };
                onUpdate(newItems);
              }}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onUpdate([...items, { name: "", role: "", company: "", quote: "" }])
        }
      >
        Add Testimonial
      </Button>
    </div>
  );
}

function StatsEditor({
  items,
  onUpdate,
}: {
  items: { label: string; value: string }[];
  onUpdate: (items: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Statistics</h3>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item.value}
            placeholder="Value"
            onChange={(e) => {
              const newItems = [...items];
              newItems[i] = { ...newItems[i], value: e.target.value };
              onUpdate(newItems);
            }}
          />
          <Input
            value={item.label}
            placeholder="Label"
            onChange={(e) => {
              const newItems = [...items];
              newItems[i] = { ...newItems[i], label: e.target.value };
              onUpdate(newItems);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onUpdate(items.filter((_, j) => j !== i))}
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUpdate([...items, { value: "", label: "" }])}
      >
        Add Statistic
      </Button>
    </div>
  );
}

function PricingEditor({
  items,
  onUpdate,
}: {
  items: any[];
  onUpdate: (items: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pricing</h3>
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                  value={item.name || ""}
                  placeholder="Plan name"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = { ...newItems[i], name: e.target.value };
                    onUpdate(newItems);
                  }}
                />
                <Input
                  value={item.price || ""}
                  placeholder="Price"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[i] = { ...newItems[i], price: e.target.value };
                    onUpdate(newItems);
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={item.features?.join("\n") || ""}
              placeholder="Features (one per line)"
              rows={3}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = {
                  ...newItems[i],
                  features: e.target.value.split("\n").filter(Boolean),
                };
                onUpdate(newItems);
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.highlighted || false}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[i] = { ...newItems[i], highlighted: e.target.checked };
                  onUpdate(newItems);
                }}
              />
              <label className="text-sm">Highlighted</label>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onUpdate([...items, { name: "", price: "", features: [], cta: "Get Started", highlighted: false }])
        }
      >
        Add Pricing Tier
      </Button>
    </div>
  );
}

function FAQEditor({
  items,
  onUpdate,
}: {
  items: { question: string; answer: string }[];
  onUpdate: (items: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">FAQ</h3>
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <Input
                value={item.question || ""}
                placeholder="Question"
                className="flex-1"
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[i] = { ...newItems[i], question: e.target.value };
                  onUpdate(newItems);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={item.answer || ""}
              placeholder="Answer"
              rows={2}
              onChange={(e) => {
                const newItems = [...items];
                newItems[i] = { ...newItems[i], answer: e.target.value };
                onUpdate(newItems);
              }}
            />
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onUpdate([...items, { question: "", answer: "" }])}
      >
        Add FAQ
      </Button>
    </div>
  );
}
