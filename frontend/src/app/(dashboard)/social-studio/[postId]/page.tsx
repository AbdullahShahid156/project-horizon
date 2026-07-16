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
import {
  socialStudioService,
  type SocialPost,
} from "@/services/social-studio";

type HistoryEntry = {
  id: string;
  post_id: string;
  action: string;
  content_before: string | null;
  content_after: string | null;
  ai_provider: string | null;
  latency_ms: number | null;
  created_at: string;
};
import {
  ArrowLeft,
  Save,
  Trash2,
  Copy,
  Send,
  Archive,
  Loader2,
  Sparkles,
  History,
  Settings,
  FileText,
  Wand2,
  Type,
  Minimize2,
  Maximize2,
  Languages,
  TrendingUp,
  Pencil,
  Hash,
  Eye,
} from "lucide-react";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "twitter", label: "X (Twitter)", icon: "🐦" },
  { value: "threads", label: "Threads", icon: "🧵" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "youtube", label: "YouTube", icon: "📺" },
];

const POST_TYPES = [
  { value: "single", label: "Single" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "poll", label: "Poll" },
  { value: "giveaway", label: "Giveaway" },
  { value: "promotional", label: "Promotional" },
  { value: "educational", label: "Educational" },
  { value: "product-launch", label: "Product Launch" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const TONES = ["Professional", "Casual", "Friendly", "Humorous", "Inspirational", "Urgent", "Educational", "Empathetic", "Bold", "Witty"];

const GOALS = ["Brand Awareness", "Engagement", "Lead Generation", "Sales", "Community Building", "Education", "Traffic", "Conversions"];

const AI_ACTIONS = [
  { value: "rewrite", label: "Rewrite", icon: Pencil },
  { value: "expand", label: "Expand", icon: Maximize2 },
  { value: "shorten", label: "Shorten", icon: Minimize2 },
  { value: "change_tone", label: "Change Tone", icon: Type },
  { value: "translate", label: "Translate", icon: Languages },
  { value: "improve_engagement", label: "Improve Engagement", icon: TrendingUp },
];

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

function getPlatformIcon(platform: string) {
  const p = PLATFORMS.find((pl) => pl.value === platform);
  return p?.icon || "📱";
}

export default function SocialPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const postId = params.postId as string;

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [cta, setCta] = useState("");

  const [platform, setPlatform] = useState("");
  const [postType, setPostType] = useState("");
  const [status, setStatus] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [business, setBusiness] = useState("");
  const [brand, setBrand] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    try {
      const data = await socialStudioService.getPost(postId);
      setPost(data ?? null);
      setContent(data?.content ?? "");
      setHeadline(data?.headline || "");
      setCaption(data?.caption || "");
      setHashtags(data?.hashtags ?? []);
      setCta(data?.cta || "");
      setPlatform(data?.platform ?? "");
      setPostType(data?.post_type ?? "");
      setStatus(data?.status ?? "");
      setScheduledDate(data?.scheduled_date ? data.scheduled_date.slice(0, 16) : "");
      setBusiness(data?.business || "");
      setBrand(data?.brand || "");
      setTargetAudience(data?.target_audience || "");
      setGoal(data?.goal || "");
      setTone(data?.tone || "");
      setKeywords(data?.keywords ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load post", variant: "destructive" });
      router.push("/social-studio");
    } finally {
      setLoading(false);
    }
  }, [postId, addToast, router]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await socialStudioService.getPostHistory(postId);
      setHistory(data ?? []);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetchHistory();
  }, [fetchPost, fetchHistory]);

  const handleSave = async () => {
    if (!post) return;
    try {
      setSaving(true);
      await socialStudioService.updatePost(postId, {
        content,
        headline: headline || undefined,
        caption: caption || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        cta: cta || undefined,
        status,
        scheduled_date: scheduledDate || undefined,
      });
      addToast({ title: "Saved", description: "Post updated successfully", variant: "success" });
      fetchPost();
      fetchHistory();
    } catch {
      addToast({ title: "Error", description: "Failed to save post", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setActionLoading("publish");
      await socialStudioService.publishPost(postId);
      addToast({ title: "Published", description: "Post published successfully", variant: "success" });
      fetchPost();
    } catch {
      addToast({ title: "Error", description: "Failed to publish post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    try {
      setActionLoading("archive");
      await socialStudioService.archivePost(postId);
      addToast({ title: "Archived", description: "Post archived", variant: "success" });
      fetchPost();
    } catch {
      addToast({ title: "Error", description: "Failed to archive post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await socialStudioService.deletePost(postId);
      addToast({ title: "Deleted", description: "Post deleted", variant: "success" });
      router.push("/social-studio");
    } catch {
      addToast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    try {
      setActionLoading("duplicate");
      const duplicated = await socialStudioService.duplicatePost(postId);
      addToast({ title: "Duplicated", description: "Post duplicated successfully", variant: "success" });
      router.push(`/social-studio/${duplicated.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to duplicate post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAiAction = async (action: string, context?: string) => {
    try {
      setAiLoading(action);
      const result = await socialStudioService.aiAction({
        post_id: postId,
        action,
        context,
      });
      setContent(result.content);
      addToast({ title: "AI Action Complete", description: `Content ${action.replace("_", " ")} successfully`, variant: "success" });
      fetchHistory();
    } catch {
      addToast({ title: "Error", description: `Failed to ${action.replace("_", " ")}`, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getPlatformIcon(platform)}</span>
              <h1 className="text-3xl font-bold">
                {headline || content.slice(0, 50) || "Untitled Post"}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${statusColors[status] || ""}`}>
                {status}
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">{platform}</span>
              {post.ai_generated && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {status !== "published" && (
            <Button variant="outline" size="sm" onClick={handlePublish} disabled={actionLoading === "publish"}>
              {actionLoading === "publish" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Publish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={actionLoading === "archive"}>
            {actionLoading === "archive" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Archive className="mr-1 h-4 w-4" />}
            Archive
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={actionLoading === "duplicate"}>
            {actionLoading === "duplicate" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Copy className="mr-1 h-4 w-4" />}
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={actionLoading === "delete"}>
            {actionLoading === "delete" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="mr-1 h-3 w-3" /> Content
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-3 w-3" /> Settings
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-1 h-3 w-3" /> AI Actions
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-3 w-3" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Content *</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      placeholder="Write your post content..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Headline</label>
                      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Post headline" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Caption</label>
                      <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Additional caption" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Call to Action</label>
                    <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Shop Now, Learn More, Sign Up..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Hashtags</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add hashtag"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                      />
                      <Button variant="outline" size="sm" onClick={addHashtag}>
                        <Hash className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeHashtag(tag)}>
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{getPlatformIcon(platform)}</span>
                      <span className="font-medium capitalize">{platform}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[status] || ""}`}>
                        {status}
                      </Badge>
                    </div>
                    {headline && (
                      <h3 className="font-bold text-lg mb-2">{headline}</h3>
                    )}
                    <p className="whitespace-pre-wrap text-sm mb-3">{content}</p>
                    {caption && (
                      <p className="text-sm text-muted-foreground mb-3 italic">{caption}</p>
                    )}
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {hashtags.map((tag) => (
                          <span key={tag} className="text-blue-500 text-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                    {cta && (
                      <div className="mt-3">
                        <Badge variant="default" className="cursor-pointer">{cta}</Badge>
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>0 likes · 0 comments · 0 shares</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform & Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map((p) => (
                    <div
                      key={p.value}
                      className={`p-3 border rounded-lg cursor-pointer text-center ${platform === p.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                      onClick={() => setPlatform(p.value)}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <p className="text-xs mt-1">{p.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Post Type</label>
                <div className="flex flex-wrap gap-2">
                  {POST_TYPES.map((t) => (
                    <Badge
                      key={t.value}
                      variant={postType === t.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setPostType(t.value)}
                    >
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status & Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Badge
                      key={s.value}
                      variant={status === s.value ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setStatus(s.value)}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </div>
              {status === "scheduled" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Scheduled Date</label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Business</label>
                  <Input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Brand</label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Audience</label>
                <Textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Describe your target audience..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="">Select goal</option>
                    {GOALS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="">Select tone</option>
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Keywords</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  />
                  <Button variant="outline" onClick={addKeyword}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(kw)}>
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Content Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use AI to transform your post content. Each action will update the content field.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AI_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.value}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => handleAiAction(action.value)}
                      disabled={aiLoading !== null || !content}
                    >
                      {aiLoading === action.value ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom AI Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Provide additional context for AI actions (e.g., target language for translate).
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Additional context (optional)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                      handleAiAction("rewrite", (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    if (input.value) {
                      handleAiAction("rewrite", input.value);
                      input.value = "";
                    }
                  }}
                  disabled={aiLoading !== null || !content}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edit & AI History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No history yet. Edits and AI actions will appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {entry.action}
                          </Badge>
                          {entry.ai_provider && (
                            <Badge variant="outline" className="text-xs">
                              {entry.ai_provider}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.latency_ms && <span>{entry.latency_ms.toFixed(0)}ms</span>}
                          <span>{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {entry.content_before && entry.content_after && (
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="p-2 bg-red-50 rounded border border-red-100">
                            <p className="font-medium text-red-700 mb-1">Before</p>
                            <p className="text-red-600 line-clamp-2">{entry.content_before}</p>
                          </div>
                          <div className="p-2 bg-green-50 rounded border border-green-100">
                            <p className="font-medium text-green-700 mb-1">After</p>
                            <p className="text-green-600 line-clamp-2">{entry.content_after}</p>
                          </div>
                        </div>
                      )}
                      {entry.content_after && !entry.content_before && (
                        <div className="mt-2 text-xs">
                          <p className="text-muted-foreground line-clamp-2">{entry.content_after}</p>
                        </div>
                      )}
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
