"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { emailStudioService, type EmailCampaign } from "@/services/email-studio";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Mail,
  Handshake,
  Send,
  Megaphone,
  ShoppingCart,
  UserCheck,
  MessageSquare,
  Heart,
  PartyPopper,
  CalendarDays,
  Tag,
  UserPlus,
  Check,
  X,
} from "lucide-react";

const WORKSPACE_ID = "ws-default";

const EMAIL_TYPES = [
  { value: "welcome", label: "Welcome", icon: Handshake, description: "Greet new subscribers and set expectations" },
  { value: "newsletter", label: "Newsletter", icon: Mail, description: "Regular updates with news and content" },
  { value: "promotional", label: "Promotional", icon: Megaphone, description: "Promote sales, offers, or campaigns" },
  { value: "product-launch", label: "Product Launch", icon: Sparkles, description: "Announce new products or features" },
  { value: "abandoned-cart", label: "Abandoned Cart", icon: ShoppingCart, description: "Recover lost sales from abandoned carts" },
  { value: "follow-up", label: "Follow-up", icon: UserCheck, description: "Follow up after a purchase or interaction" },
  { value: "cold-outreach", label: "Cold Outreach", icon: MessageSquare, description: "Reach out to potential new customers" },
  { value: "thank-you", label: "Thank You", icon: Heart, description: "Express gratitude to customers" },
  { value: "event-invitation", label: "Event Invitation", icon: CalendarDays, description: "Invite to webinars, launches, or events" },
  { value: "discount", label: "Discount", icon: Tag, description: "Share exclusive discount codes" },
  { value: "re-engagement", label: "Re-engagement", icon: UserPlus, description: "Win back inactive subscribers" },
  { value: "announcement", label: "Announcement", icon: PartyPopper, description: "Share important company news" },
];

const GOALS = [
  { value: "awareness", label: "Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "conversion", label: "Conversion" },
  { value: "retention", label: "Retention" },
  { value: "announcement", label: "Announcement" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "urgent", label: "Urgent" },
  { value: "empathetic", label: "Empathetic" },
  { value: "playful", label: "Playful" },
];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Chinese", label: "Chinese" },
  { value: "Japanese", label: "Japanese" },
];

const STEPS = ["Campaign Details", "Context", "Generate"];

export default function CreateEmailCampaignPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [emailType, setEmailType] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("English");
  const [product, setProduct] = useState("");
  const [cta, setCta] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCampaigns, setGeneratedCampaigns] = useState<EmailCampaign[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const addKeyword = () => {
    const val = keywordInput.trim();
    if (val && !keywords.includes(val)) {
      setKeywords((prev) => [...prev, val]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleGenerate = useCallback(async () => {
    if (!emailType) {
      addToast({ title: "Error", description: "Please select an email type", variant: "destructive" });
      return;
    }
    try {
      setGenerating(true);
      const result = await emailStudioService.generateEmail({
        workspace_id: WORKSPACE_ID,
        email_type: emailType,
        campaign_name: campaignName || undefined,
        brand: brand || undefined,
        audience: audience || undefined,
        goal: goal || undefined,
        tone: tone || undefined,
        language,
        cta: cta || undefined,
        product: product || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      });
      setGeneratedCampaigns(result?.campaigns ?? []);
      if ((result?.campaigns ?? []).length > 0) {
        setPreviewHtml(result.campaigns[0].html_content);
        setPreviewIndex(0);
      }
      addToast({
        title: "Generated",
        description: `Email generated in ${result?.latency_ms ?? 0}ms using ${result?.provider ?? "AI"}`,
        variant: "success",
      });
    } catch {
      addToast({ title: "Error", description: "Failed to generate email", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [emailType, campaignName, brand, audience, goal, tone, language, cta, product, keywords, addToast]);

  const handleCreateManually = useCallback(async () => {
    if (!campaignName || !subjectLine) {
      addToast({ title: "Error", description: "Campaign name and subject are required", variant: "destructive" });
      return;
    }
    try {
      setGenerating(true);
      const campaign = await emailStudioService.createCampaign({
        workspace_id: WORKSPACE_ID,
        name: campaignName,
        subject: subjectLine,
        preview_text: previewText || undefined,
        email_type: emailType || undefined,
        brand: brand || undefined,
        audience: audience || undefined,
        goal: goal || undefined,
        tone: tone || undefined,
        language,
        cta: cta || undefined,
        product: product || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
      });
      addToast({ title: "Created", description: "Campaign created successfully", variant: "success" });
      router.push(`/email-studio/${campaign.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [campaignName, subjectLine, previewText, emailType, brand, audience, goal, tone, language, cta, product, keywords, addToast, router]);

  const selectedType = EMAIL_TYPES.find((t) => t.value === emailType);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Email Campaign</h1>
          <p className="text-muted-foreground mt-1">Set up your campaign and generate content with AI</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  i + 1 < step
                    ? "bg-primary text-primary-foreground"
                    : i + 1 === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={i + 1 === step ? "font-medium" : "text-muted-foreground"}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-12 h-px bg-border" />}
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Email Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {EMAIL_TYPES.map((type) => {
                  const Icon = type.icon;
                  const selected = emailType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setEmailType(type.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Campaign Name</label>
                  <Input
                    placeholder="e.g. Summer Sale 2025"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject Line</label>
                  <Input
                    placeholder="e.g. Don't miss out on our biggest sale!"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Preview Text</label>
                  <Input
                    placeholder="e.g. Up to 50% off all items this weekend"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Brand & Audience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Brand Name</label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Target Audience</label>
                  <Textarea
                    placeholder="e.g. Young professionals aged 25-35 interested in fitness"
                    rows={2}
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Goal & Tone</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Goal</label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Product & CTA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Product / Service</label>
                  <Input
                    placeholder="e.g. Premium Fitness App"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Call to Action</label>
                  <Input
                    placeholder="e.g. Start Your Free Trial"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Keywords</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button
                        onClick={() => removeKeyword(kw)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{selectedType?.label || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Campaign Name</span>
                  <p className="font-medium">{campaignName || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject</span>
                  <p className="font-medium">{subjectLine || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Brand</span>
                  <p className="font-medium">{brand || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Goal</span>
                  <p className="font-medium capitalize">{goal || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tone</span>
                  <p className="font-medium capitalize">{tone || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Language</span>
                  <p className="font-medium">{language}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Product</span>
                  <p className="font-medium">{product || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CTA</span>
                  <p className="font-medium">{cta || "—"}</p>
                </div>
              </div>
              {keywords.length > 0 && (
                <div className="mt-4">
                  <span className="text-muted-foreground text-sm">Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1"
              size="lg"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
            <Button
              onClick={handleCreateManually}
              disabled={generating || !campaignName || !subjectLine}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Create Manually
            </Button>
          </div>

          {generatedCampaigns.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">Generated Content</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {generatedCampaigns.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setPreviewIndex(i);
                        setPreviewHtml(c.html_content);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                        previewIndex === i
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Variation {i + 1}
                    </button>
                  ))}
                </div>
                {previewHtml && (
                  <div
                    className="border rounded-lg overflow-hidden bg-white"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
                <Button
                  onClick={() => router.push(`/email-studio/${generatedCampaigns[previewIndex].id}`)}
                  className="w-full"
                >
                  Edit Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="text-sm text-muted-foreground">
          Step {step} of {STEPS.length}
        </div>
        {step < 3 && (
          <Button
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={step === 3 || (step === 1 && !emailType)}
          >
            Next
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
