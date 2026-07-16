"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { socialStudioService, type SocialCampaign } from "@/services/social-studio";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Wand2,
  Copy,
  RefreshCw,
  Send,
  Hash,
  Image as ImageIcon,
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
  { value: "single", label: "Single Post" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel Script" },
  { value: "poll", label: "Poll" },
  { value: "giveaway", label: "Giveaway" },
  { value: "promotional", label: "Promotional" },
  { value: "educational", label: "Educational" },
  { value: "product-launch", label: "Product Launch" },
];

const TONES = ["Professional", "Casual", "Friendly", "Humorous", "Inspirational", "Urgent", "Educational", "Empathetic", "Bold", "Witty"];

const GOALS = ["Brand Awareness", "Engagement", "Lead Generation", "Sales", "Community Building", "Education", "Traffic", "Conversions"];

export default function SocialCreatePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Array<{ id: string; content: string; platform: string }>>([]);

  const [form, setForm] = useState({
    platform: "instagram",
    post_type: "single",
    business: "",
    brand: "",
    campaign_id: "",
    target_audience: "",
    goal: "",
    tone: "",
    keywords: [] as string[],
    cta: "",
    topic: "",
    content: "",
    headline: "",
    caption: "",
    hashtags: [] as string[],
    emojis: [] as string[],
    num_variations: 1,
  });

  const [keywordInput, setKeywordInput] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");

  useEffect(() => {
    socialStudioService.listCampaigns("ws-default").then((r) => setCampaigns(Array.isArray(r) ? r : r?.items ?? [])).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!form.topic && !form.content) {
      addToast({ title: "Error", description: "Please enter a topic or content", variant: "destructive" });
      return;
    }
    try {
      setIsGenerating(true);
      const result = await socialStudioService.generatePost({
        workspace_id: "ws-default",
        platform: form.platform,
        post_type: form.post_type,
        business: form.business || undefined,
        brand: form.brand || undefined,
        campaign_id: form.campaign_id || undefined,
        target_audience: form.target_audience || undefined,
        goal: form.goal || undefined,
        tone: form.tone || undefined,
        keywords: form.keywords.length > 0 ? form.keywords : undefined,
        cta: form.cta || undefined,
        topic: form.topic || undefined,
        num_variations: form.num_variations,
      });
      setGeneratedPosts((result?.posts ?? []).map((p) => ({ id: p.id, content: p.content, platform: p.platform })));
      addToast({ title: "Posts generated", description: `${(result?.posts ?? []).length} post(s) created in ${result?.latency_ms?.toFixed(0) ?? "0"}ms` });
    } catch {
      addToast({ title: "Error", description: "Failed to generate posts", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManual = async () => {
    if (!form.content) {
      addToast({ title: "Error", description: "Content is required", variant: "destructive" });
      return;
    }
    try {
      const post = await socialStudioService.createPost({
        workspace_id: "ws-default",
        platform: form.platform,
        post_type: form.post_type,
        content: form.content,
        headline: form.headline || undefined,
        caption: form.caption || undefined,
        hashtags: form.hashtags.length > 0 ? form.hashtags : undefined,
        cta: form.cta || undefined,
        emojis: form.emojis.length > 0 ? form.emojis : undefined,
        business: form.business || undefined,
        brand: form.brand || undefined,
        target_audience: form.target_audience || undefined,
        goal: form.goal || undefined,
        tone: form.tone || undefined,
        keywords: form.keywords.length > 0 ? form.keywords : undefined,
        campaign_id: form.campaign_id || undefined,
      });
      addToast({ title: "Post created" });
      router.push(`/social-studio/${post.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      setForm({ ...form, keywords: [...form.keywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !form.hashtags.includes(hashtagInput.trim())) {
      setForm({ ...form, hashtags: [...form.hashtags, hashtagInput.trim()] });
      setHashtagInput("");
    }
  };

  const selectedPlatform = PLATFORMS.find((p) => p.value === form.platform);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold">Create Social Post</h1>
          <p className="text-muted-foreground mt-1">Generate AI-powered social media content</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["Platform", "Context", "Generate"].map((title, i) => (
          <div key={title} className={`flex-1 h-2 rounded-full ${i < step ? "bg-primary" : i === step - 1 ? "bg-primary/60" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Choose Platform & Type</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <div key={p.value} className={`p-3 border rounded-lg cursor-pointer text-center ${form.platform === p.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`} onClick={() => setForm({ ...form, platform: p.value })}>
                    <span className="text-2xl">{p.icon}</span>
                    <p className="text-sm mt-1">{p.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Post Type</label>
              <div className="flex flex-wrap gap-2">
                {POST_TYPES.map((t) => (
                  <Badge key={t.value} variant={form.post_type === t.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({ ...form, post_type: t.value })}>{t.label}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Campaign (optional)</label>
              <select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                <option value="">No campaign</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Content Context</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Business Name</label>
                <Input placeholder="Acme Corp" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Brand Name</label>
                <Input placeholder="Acme Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Audience</label>
              <Textarea placeholder="Young professionals interested in technology..." value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Goal</label>
                <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                  <option value="">Select goal</option>
                  {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tone</label>
                <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                  <option value="">Select tone</option>
                  {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Topic / Main Idea *</label>
              <Textarea placeholder="What should the post be about?" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Keywords</label>
              <div className="flex gap-2">
                <Input placeholder="Add keyword" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} />
                <Button variant="outline" onClick={addKeyword}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.keywords.map((k) => (
                  <Badge key={k} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, keywords: form.keywords.filter((x) => x !== k) })}>{k} ×</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Call to Action</label>
              <Input placeholder="Shop Now, Learn More, Sign Up..." value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Generate or Write</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{selectedPlatform?.icon} {selectedPlatform?.label} · {POST_TYPES.find((t) => t.value === form.post_type)?.label}</p>
              {form.topic && <p className="text-sm text-muted-foreground mt-1">Topic: {form.topic}</p>}
              {form.tone && <p className="text-sm text-muted-foreground">Tone: {form.tone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" onClick={handleGenerate} disabled={isGenerating || (!form.topic && !form.content)}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
              <Button size="lg" variant="outline" onClick={handleCreateManual} disabled={!form.content}>
                Create Manually
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Or write your own content</label>
              <Textarea placeholder="Write your post content here..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Headline</label>
                <Input placeholder="Post headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Caption</label>
                <Input placeholder="Additional caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hashtags</label>
              <div className="flex gap-2">
                <Input placeholder="Add hashtag" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())} />
                <Button variant="outline" onClick={addHashtag}><Hash className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.hashtags.map((h) => (
                  <Badge key={h} variant="secondary" className="cursor-pointer" onClick={() => setForm({ ...form, hashtags: form.hashtags.filter((x) => x !== h) })}>#{h} ×</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Variations: {form.num_variations}</label>
              <input type="range" min={1} max={5} value={form.num_variations} onChange={(e) => setForm({ ...form, num_variations: Number(e.target.value) })} className="w-full" />
            </div>
            {generatedPosts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Generated Posts:</p>
                {generatedPosts.map((post) => (
                  <div key={post.id} className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => router.push(`/social-studio/${post.id}`)}>
                    <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < 3 && <Button onClick={() => setStep(step + 1)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}
      </div>
    </div>
  );
}
