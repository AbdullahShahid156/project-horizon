"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  emailStudioService,
  type EmailCampaign,
  type EmailTemplate,
  type EmailStats,
} from "@/services/email-studio";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  FileText,
  Copy,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Users,
  Eye,
  MousePointerClick,
  Calendar,
  Layout,
} from "lucide-react";

const WORKSPACE_ID = "ws-default";

const EMAIL_TYPES = [
  { value: "welcome", label: "Welcome" },
  { value: "newsletter", label: "Newsletter" },
  { value: "promotional", label: "Promotional" },
  { value: "product-launch", label: "Product Launch" },
  { value: "abandoned-cart", label: "Abandoned Cart" },
  { value: "follow-up", label: "Follow-up" },
  { value: "cold-outreach", label: "Cold Outreach" },
  { value: "thank-you", label: "Thank You" },
  { value: "event-invitation", label: "Event Invitation" },
  { value: "discount", label: "Discount" },
  { value: "re-engagement", label: "Re-engagement" },
  { value: "announcement", label: "Announcement" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "saas", label: "SaaS" },
  { value: "startup", label: "Startup" },
  { value: "agency", label: "Agency" },
  { value: "education", label: "Education" },
];

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  sent: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const typeColors: Record<string, string> = {
  welcome: "bg-blue-100 text-blue-800 border-blue-200",
  newsletter: "bg-purple-100 text-purple-800 border-purple-200",
  promotional: "bg-orange-100 text-orange-800 border-orange-200",
  "product-launch": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "abandoned-cart": "bg-red-100 text-red-800 border-red-200",
  "follow-up": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "cold-outreach": "bg-teal-100 text-teal-800 border-teal-200",
  "thank-you": "bg-pink-100 text-pink-800 border-pink-200",
  "event-invitation": "bg-amber-100 text-amber-800 border-amber-200",
  discount: "bg-lime-100 text-lime-800 border-lime-200",
  "re-engagement": "bg-violet-100 text-violet-800 border-violet-200",
  announcement: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const categoryColors: Record<string, string> = {
  business: "bg-blue-100 text-blue-800 border-blue-200",
  ecommerce: "bg-green-100 text-green-800 border-green-200",
  saas: "bg-purple-100 text-purple-800 border-purple-200",
  startup: "bg-orange-100 text-orange-800 border-orange-200",
  agency: "bg-pink-100 text-pink-800 border-pink-200",
  education: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export default function EmailStudioPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [tab, setTab] = useState("campaigns");
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsTotalPages, setCampaignsTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchStats = useCallback(async () => {
    try {
      const s = await emailStudioService.getStats(WORKSPACE_ID);
      setStats(s ?? null);
    } catch {
      addToast({ title: "Error", description: "Failed to load stats", variant: "destructive" });
    }
  }, [addToast]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const data = await emailStudioService.listCampaigns(WORKSPACE_ID, {
        search: search || undefined,
        email_type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: campaignsPage,
        page_size: 12,
      });
      setCampaigns(data?.items ?? []);
      setCampaignsTotal(data?.total ?? 0);
      setCampaignsTotalPages(data?.total_pages ?? 1);
    } catch {
      addToast({ title: "Error", description: "Failed to load campaigns", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, campaignsPage, addToast]);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const data = await emailStudioService.listTemplates(WORKSPACE_ID, {
        category: categoryFilter === "all" ? undefined : categoryFilter,
      });
      setTemplates(data ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setTemplatesLoading(false);
    }
  }, [categoryFilter, addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (tab === "templates") fetchTemplates();
  }, [tab, fetchTemplates]);

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setActionLoading(campaignId);
      await emailStudioService.deleteCampaign(campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      setCampaignsTotal((prev) => prev - 1);
      addToast({ title: "Deleted", description: "Campaign deleted successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    try {
      setActionLoading(campaignId);
      const duplicated = await emailStudioService.duplicateCampaign(campaignId);
      setCampaigns((prev) => [duplicated, ...prev]);
      setCampaignsTotal((prev) => prev + 1);
      addToast({ title: "Duplicated", description: "Campaign duplicated successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to duplicate campaign", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      setActionLoading(campaignId);
      await emailStudioService.sendCampaign(campaignId);
      await fetchCampaigns();
      await fetchStats();
      addToast({ title: "Sent", description: "Campaign sent successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to send campaign", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      setActionLoading(templateId);
      const template = await emailStudioService.useTemplate(templateId);
      router.push(`/email-studio/create?templateId=${template.id}`);
    } catch {
      addToast({ title: "Error", description: "Failed to load template", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return "—";
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Marketing Studio</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and optimize your email campaigns with AI
          </p>
        </div>
        <Link href="/email-studio/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Campaigns", value: stats?.total_campaigns ?? 0, icon: Mail },
            { label: "Templates", value: stats?.total_templates ?? 0, icon: Layout },
            { label: "AI Generated", value: stats?.ai_generated_count ?? 0, icon: Sparkles },
            { label: "Total Recipients", value: stats?.total_recipients ?? 0, icon: Users },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px]" />
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="mr-1 h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Layout className="mr-1 h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCampaignsPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCampaignsPage(1); }}>
                <SelectTrigger className="w-[160px]" aria-label="Filter by email type">
                  <SelectValue placeholder="Email Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EMAIL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCampaignsPage(1); }}>
                <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{campaignsTotal} campaigns</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={campaignsPage <= 1} onClick={() => setCampaignsPage(campaignsPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {campaignsPage} of {campaignsTotalPages}</span>
              <Button variant="ghost" size="sm" disabled={campaignsPage >= campaignsTotalPages} onClick={() => setCampaignsPage(campaignsPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first email campaign to get started.
                </p>
                <Link href="/email-studio/create">
                  <Button>Create Your First Campaign</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="group hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => router.push(`/email-studio/${campaign.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${statusColors[campaign.status] || ""}`}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${typeColors[campaign.email_type] || ""}`}>
                          {campaign.email_type}
                        </Badge>
                        {campaign.ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/email-studio/${campaign.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {campaign.status !== "sent" && (
                              <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                                <Send className="mr-2 h-4 w-4" /> Send
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this campaign? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCampaign(campaign.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{campaign.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{campaign.subject}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatRate(campaign.open_rate)} opens</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        <span>{formatRate(campaign.click_rate)} clicks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {campaign.sent_at
                        ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}`
                        : new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    {actionLoading === campaign.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {campaignsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={campaignsPage <= 1} onClick={() => setCampaignsPage(campaignsPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {campaignsPage} of {campaignsTotalPages}
              </span>
              <Button variant="outline" size="sm" disabled={campaignsPage >= campaignsTotalPages} onClick={() => setCampaignsPage(campaignsPage + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
              <SelectTrigger className="w-[160px]" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {templatesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Layout className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Templates will appear here as they become available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${categoryColors[template.category] || ""}`}>
                          {template.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${typeColors[template.email_type] || ""}`}>
                          {template.email_type}
                        </Badge>
                      </div>
                      {template.is_system && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Used {template.usage_count} times
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === template.id}
                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(template.id); }}
                      >
                        {actionLoading === template.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="mr-1 h-3 w-3" />
                        )}
                        Use Template
                      </Button>
                    </div>
                    {actionLoading === template.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
