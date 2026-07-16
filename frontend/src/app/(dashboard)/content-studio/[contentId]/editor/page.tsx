"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Wand2,
  Loader2,
  Search,
  Clock,
  Download,
  Heart,
  Eye,
  ChevronDown,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Quote,
  Code,
  Minus,
  BarChart3,
  Sparkles,
  RotateCcw,
  Copy,
  Trash2,
} from "lucide-react";
import {
  contentStudioService,
  CONTENT_TYPES,
  type ContentItem,
  type ContentVersion,
  type ContentSEOAnalysis,
  type ContentType,
  type ContentAIOptimizeResponse,
} from "@/services/content-studio";

const aiActions = [
  { value: "improve", label: "Improve", icon: "✨" },
  { value: "regenerate", label: "Regenerate", icon: "🔄" },
  { value: "rewrite", label: "Rewrite", icon: "📝" },
  { value: "shorten", label: "Shorten", icon: "✂️" },
  { value: "expand", label: "Expand", icon: "📏" },
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "luxury", label: "Luxury", icon: "💎" },
  { value: "startup", label: "Startup", icon: "🚀" },
  { value: "technical", label: "Technical", icon: "⚙️" },
  { value: "persuasive", label: "Persuasive", icon: "🎯" },
  { value: "simplify", label: "Simplify", icon: "📖" },
  { value: "grammar_fix", label: "Grammar Fix", icon: "✅" },
  { value: "seo_optimize", label: "SEO Optimize", icon: "🔍" },
];

export default function ContentEditorPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;
  const editorRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<ContentSEOAnalysis | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [aiAction, setAiAction] = useState("improve");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [title, setTitle] = useState("");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("editor");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const data = await contentStudioService.getContent(contentId);
      setItem(data ?? null);
      setTitle(data?.title ?? "");
      setEditorContent(data?.html_body || data?.plain_body || "");
      if (data?.seo_data) {
        setMetaTitle((data.seo_data as Record<string, unknown>).meta_title as string || "");
        setMetaDescription((data.seo_data as Record<string, unknown>).meta_description as string || "");
        const kw = (data.seo_data as Record<string, unknown>).keywords;
        setMetaKeywords(Array.isArray(kw) ? kw.join(", ") : "");
      }
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  const loadVersions = useCallback(async () => {
    try {
      const data = await contentStudioService.listVersions(contentId);
      setVersions(data ?? []);
    } catch (err) {
      console.error("Failed to load versions:", err);
    }
  }, [contentId]);

  useEffect(() => {
    loadContent();
    loadVersions();
  }, [loadContent, loadVersions]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== editorContent) {
      editorRef.current.innerHTML = editorContent;
    }
  }, [editorContent]);

  const pushUndo = () => {
    if (editorRef.current) {
      setUndoStack((prev) => [...prev.slice(-49), editorRef.current!.innerHTML]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, editorContent]);
    setUndoStack((u) => u.slice(0, -1));
    setEditorContent(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, editorContent]);
    setRedoStack((r) => r.slice(0, -1));
    setEditorContent(next);
  };

  const execCommand = (cmd: string, value?: string) => {
    pushUndo();
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setEditorContent(html);
    }
  };

  const handleSelectText = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleAutoSave = async () => {
    if (!item) return;
    try {
      setSaving(true);
      await contentStudioService.autoSave(item.id, {
        html_body: editorContent,
        plain_body: editorContent.replace(/<[^>]+>/g, " "),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;
    try {
      setSaving(true);
      await contentStudioService.updateContent(item.id, {
        title,
        html_body: editorContent,
        plain_body: editorContent.replace(/<[^>]+>/g, " "),
        seo_data: {
          meta_title: metaTitle,
          meta_description: metaDescription,
          keywords: metaKeywords.split(",").map((k) => k.trim()).filter(Boolean),
        },
        change_summary: "Manual save",
      });
      setLastSaved(new Date());
      await loadVersions();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAIOptimize = async (action: string) => {
    const text = selectedText || editorContent.replace(/<[^>]+>/g, " ");
    if (!text.trim()) return;

    try {
      setAiLoading(true);
      const result = await contentStudioService.optimizeContent({
        text,
        action,
        content_type: item?.content_type,
      });
      if (selectedText && editorRef.current) {
        const html = editorRef.current.innerHTML;
        const plain = html;
        const idx = plain.indexOf(selectedText);
        if (idx !== -1) {
          const newHtml = html.substring(0, idx) + result.optimized + html.substring(idx + selectedText.length);
          pushUndo();
          setEditorContent(newHtml);
          editorRef.current.innerHTML = newHtml;
        }
      } else {
        pushUndo();
        setEditorContent(result.optimized);
        if (editorRef.current) {
          editorRef.current.innerHTML = result.optimized;
        }
      }
    } catch (err) {
      console.error("AI optimize failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSEOAnalyze = async () => {
    try {
      setSeoLoading(true);
      const result = await contentStudioService.analyzeSEO({
        title,
        body: editorContent,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords: metaKeywords.split(",").map((k) => k.trim()).filter(Boolean),
      });
      setSeoResult(result ?? null);
    } catch (err) {
      console.error("SEO analysis failed:", err);
    } finally {
      setSeoLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const updated = await contentStudioService.restoreVersion(contentId, versionId);
      setItem(updated ?? null);
      setEditorContent(updated.html_body || updated.plain_body || "");
      setTitle(updated.title);
      await loadVersions();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const result = await contentStudioService.exportContent(contentId, format);
      const blob = new Blob([result.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Content not found.</p>
        <Button variant="link" onClick={() => router.push("/content-studio")}>
          Back to Content Studio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/content-studio")} aria-label="Back to Content Studio">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <input
              className="text-xl font-bold bg-transparent border-none outline-none w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              aria-label="Content title"
            />
            <p className="text-xs text-muted-foreground">
              {CONTENT_TYPES[item.content_type as ContentType]?.label || item.content_type}
              {" · "}
              v{item.current_version}
              {lastSaved && ` · Saved ${lastSaved.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1 hidden md:inline">Save</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1 hidden md:inline">Save & Close</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="ai">AI Tools</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-1 flex-wrap border-b pb-2 mb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("bold")} aria-label="Bold">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("italic")} aria-label="Italic">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("underline")} aria-label="Underline">
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "h1")} aria-label="Heading 1">
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "h2")} aria-label="Heading 2">
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "h3")} aria-label="Heading 3">
                  <Heading3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertUnorderedList")} aria-label="Bullet list">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertOrderedList")} aria-label="Numbered list">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  const url = prompt("Enter URL:");
                  if (url) execCommand("createLink", url);
                }} aria-label="Insert link">
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "blockquote")} aria-label="Quote">
                  <Quote className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "pre")} aria-label="Code block">
                  <Code className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertHorizontalRule")} aria-label="Horizontal rule">
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={undoStack.length === 0} aria-label="Undo">
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={redoStack.length === 0} aria-label="Redo">
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 prose prose-sm max-w-none focus:outline-none"
                onInput={handleInput}
                onMouseUp={handleSelectText}
                onKeyUp={handleSelectText}
                suppressContentEditableWarning
                role="textbox"
                aria-label="Content editor"
                aria-multiline="true"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Content Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedText
                  ? `Selected text: "${selectedText.slice(0, 50)}${selectedText.length > 50 ? "..." : ""}"`
                  : "Select text in the editor to apply AI to specific content, or use an action on the full content."}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {aiActions.map((action) => (
                  <Button
                    key={action.value}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-3"
                    onClick={() => handleAIOptimize(action.value)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <span className="mr-2">{action.icon}</span>
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO-optimized title"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{metaTitle.length}/60 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-desc">Meta Description</Label>
                  <Textarea
                    id="meta-desc"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO-optimized description"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta-keywords">Keywords (comma separated)</Label>
                  <Input
                    id="meta-keywords"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <Button onClick={handleSEOAnalyze} disabled={seoLoading}>
                  {seoLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                  Analyze SEO
                </Button>
              </div>

              {seoResult && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20">
                      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={seoResult.score >= 80 ? "#22c55e" : seoResult.score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${seoResult.score}, 100`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                        {seoResult.score}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        SEO Score: {seoResult.score >= 80 ? "Good" : seoResult.score >= 50 ? "Needs Work" : "Poor"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {seoResult.readability?.word_count ?? 0} words · {seoResult.readability?.sentence_count ?? 0} sentences
                      </p>
                    </div>
                  </div>

                  {(seoResult.issues ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Issues</h4>
                      {(seoResult.issues ?? []).map((issue, i) => (
                        <div key={i} className={`text-sm p-2 rounded ${
                          issue.type === "error" ? "bg-red-50 text-red-700" :
                          issue.type === "warning" ? "bg-yellow-50 text-yellow-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {(seoResult.suggestions ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Suggestions</h4>
                      {(seoResult.suggestions ?? []).map((s, i) => (
                        <p key={i} className="text-sm text-muted-foreground">• {s}</p>
                      ))}
                    </div>
                  )}

                  {Object.keys(seoResult.keyword_density ?? {}).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Keyword Density</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(seoResult.keyword_density ?? {}).map(([kw, density]) => (
                          <div key={kw} className="flex justify-between text-sm">
                            <span>{kw}</span>
                            <span className={density > 3 ? "text-red-600" : ""}>{density}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions yet.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">v{v.version_number}</span>
                          {v.is_auto_save && <Badge variant="secondary" className="text-[10px]">Auto-save</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {v.change_summary || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(v.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { format: "html", label: "HTML", desc: "Web-ready HTML file" },
                  { format: "markdown", label: "Markdown", desc: "Markdown format" },
                  { format: "txt", label: "Plain Text", desc: "Simple text file" },
                  { format: "json", label: "JSON", desc: "Structured data" },
                ].map((opt) => (
                  <Button
                    key={opt.format}
                    variant="outline"
                    className="h-auto py-4 flex-col items-start"
                    onClick={() => handleExport(opt.format)}
                  >
                    <Download className="h-5 w-5 mb-2" />
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
