"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { emailStudioService, type EmailCampaign } from "@/services/email-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Send,
  Copy,
  Trash2,
  Loader2,
  Mail,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Type,
  Languages,
  Check,
  Wand2,
  History as HistoryIcon,
  Settings,
  Eye,
  Brain,
  FileText,
  Clock,
  Target,
  Hash,
} from "lucide-react";

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: string;
  latency: number;
  content?: string;
}

export default function EmailCampaignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [keyword, setKeyword] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const data = await emailStudioService.getCampaign(campaignId);
      setCampaign(data ?? null);
      setSubject(data?.subject || "");
      setPreviewText(data?.preview_text || "");
      setHtmlContent(data?.html_content || "");
      setMarkdownContent(data?.markdown_content || "");
    } catch {
      addToast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, addToast]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleSave = async () => {
    if (!campaign) return;
    try {
      setSaving(true);
      await emailStudioService.updateCampaign(campaignId, {
        subject,
        preview_text: previewText,
        html_content: htmlContent,
        markdown_content: markdownContent,
      });
      addToast({ title: "Success", description: "Campaign saved" });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!campaign) return;
    try {
      await emailStudioService.sendCampaign(campaignId);
      addToast({ title: "Success", description: "Campaign sent" });
    } catch {
      addToast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    if (!campaign) return;
    try {
      const newCampaign = await emailStudioService.duplicateCampaign(campaignId);
      addToast({ title: "Success", description: "Campaign duplicated" });
      router.push(`/email-studio/${newCampaign.id}`);
    } catch {
      addToast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await emailStudioService.deleteCampaign(campaignId);
      addToast({ title: "Success", description: "Campaign deleted" });
      router.push("/email-studio");
    } catch {
      addToast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleAiAction = async (action: string) => {
    if (!htmlContent) {
      addToast({
        title: "Error",
        description: "No content to process",
        variant: "destructive",
      });
      return;
    }
    try {
      setAiLoading(true);
      const result = await emailStudioService.aiAction({
        campaign_id: campaignId,
        action,
        context: aiContext || htmlContent,
      });
      setHtmlContent(result.updated);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          action,
          timestamp: new Date().toISOString(),
          latency: result.latency_ms || 0,
        },
        ...prev,
      ]);
      addToast({
        title: "Success",
        description: `AI ${action} completed`,
      });
    } catch {
      addToast({
        title: "Error",
        description: `Failed to perform AI ${action}`,
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (keyword.trim() && campaign) {
      setCampaign({
        ...campaign,
        keywords: [...(campaign.keywords || []), keyword.trim()],
      });
      setKeyword("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    if (campaign) {
      const newKeywords = [...(campaign.keywords || [])];
      newKeywords.splice(index, 1);
      setCampaign({ ...campaign, keywords: newKeywords });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      scheduled: "outline",
      sent: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharCount = (text: string) => text.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button onClick={() => router.push("/email-studio")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email Studio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/email-studio")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button size="sm" onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Actions
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Subject Line
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview Text
                </label>
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Enter preview text (shown in inbox)..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    HTML Content
                  </label>
                  <div className="text-sm text-muted-foreground">
                    {getCharCount(htmlContent)} chars | {getWordCount(htmlContent)} words
                  </div>
                </div>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<div>Enter your HTML email content...</div>"
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Markdown Content
                  </label>
                  <div className="text-sm text-muted-foreground">
                    {getCharCount(markdownContent)} chars | {getWordCount(markdownContent)} words
                  </div>
                </div>
                <Textarea
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="# Enter your markdown content..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Campaign Settings
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Type</label>
                   <div className="p-3 bg-muted rounded-md">{campaign.email_type || "N/A"}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Brand
                  </label>
                  <Input value={campaign.brand || ""} readOnly placeholder="Brand" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Audience
                  </label>
                  <Input value={campaign.audience || ""} readOnly placeholder="Audience" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Goal
                  </label>
                  <Input value={campaign.goal || ""} readOnly placeholder="Goal" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Content Settings
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Input value={campaign.tone || ""} readOnly placeholder="Tone" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Language
                  </label>
                  <Input value={campaign.language || ""} readOnly placeholder="Language" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CTA</label>
                  <Input value={campaign.cta || ""} readOnly placeholder="Call to Action" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <Input value={campaign.product || ""} readOnly placeholder="Product" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Keywords
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Add a keyword..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {campaign.keywords?.map((kw, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {kw}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Minimize2 className="mr-2 h-4 w-4" />
                  Mobile
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="space-y-1 mb-4 pb-4 border-b">
                <p className="text-sm">
                  <span className="font-medium">Subject:</span> {subject || "No subject"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Preview:</span> {previewText || "No preview text"}
                </p>
              </div>
              <div
                className={`mx-auto bg-white ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-[600px]"}`}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent || "<p>No content</p>" }}
                  className="prose max-w-none"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Actions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select an action to apply to your email content using AI.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("rewrite")}
                    disabled={aiLoading}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Rewrite
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("improve")}
                    disabled={aiLoading}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Improve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("expand")}
                    disabled={aiLoading}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Expand
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("shorten")}
                    disabled={aiLoading}
                  >
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Shorten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("personalize")}
                    disabled={aiLoading}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Personalize
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("translate")}
                    disabled={aiLoading}
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    Translate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAiAction("grammar")}
                    disabled={aiLoading}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Grammar Fix
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Custom Instructions</h3>
                <Textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Add context or specific instructions for the AI..."
                  className="min-h-[150px]"
                />
                {aiLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing with AI...
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Edit History
            </h3>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No history yet. Perform an AI action to see it here.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {entry.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {entry.latency}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}