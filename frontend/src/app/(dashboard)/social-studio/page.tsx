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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  socialStudioService,
  type SocialPost,
  type SocialCampaign,
  type SocialCalendarEntry,
  type SocialHashtag,
  type SocialStats,
} from "@/services/social-studio";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Hash,
  BarChart3,
  FileText,
  Copy,
  Send,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  Target,
  Sparkles,
  Globe,
  List,
  Grid,
} from "lucide-react";

const WORKSPACE_ID = "ws-default";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "twitter", label: "Twitter", icon: "🐦" },
  { value: "threads", label: "Threads", icon: "🧵" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "pinterest", label: "Pinterest", icon: "📌" },
  { value: "youtube", label: "YouTube", icon: "🎬" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const POST_TYPE_OPTIONS = [
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

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const campaignStatusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  paused: "bg-orange-100 text-orange-800 border-orange-200",
};

function getPlatformIcon(platform: string) {
  const p = PLATFORMS.find((pl) => pl.value === platform);
  return p?.icon || "📱";
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function SocialStudioPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [tab, setTab] = useState("posts");
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "", platforms: "" });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [calendarEntries, setCalendarEntries] = useState<SocialCalendarEntry[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [hashtags, setHashtags] = useState<SocialHashtag[]>([]);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");
  const [newHashtagCategory, setNewHashtagCategory] = useState("");
  const [addingHashtag, setAddingHashtag] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const s = await socialStudioService.getStats(WORKSPACE_ID);
      setStats(s);
    } catch {
      addToast({ title: "Error", description: "Failed to load stats", variant: "destructive" });
    }
  }, [addToast]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await socialStudioService.listPosts(WORKSPACE_ID, {
        search: search || undefined,
        platform: platformFilter === "all" ? undefined : platformFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        post_type: postTypeFilter === "all" ? undefined : postTypeFilter,
        page: postsPage,
        page_size: 12,
      });
      setPosts(data?.items ?? []);
      setPostsTotal(data?.total ?? 0);
      setPostsTotalPages(data?.total_pages ?? 1);
    } catch {
      addToast({ title: "Error", description: "Failed to load posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, platformFilter, statusFilter, postTypeFilter, postsPage, addToast]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const data = await socialStudioService.listCampaigns(WORKSPACE_ID);
      setCampaigns(data?.items ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load campaigns", variant: "destructive" });
    } finally {
      setCampaignsLoading(false);
    }
  }, [addToast]);

  const fetchCalendar = useCallback(async () => {
    try {
      setCalendarLoading(true);
      const data = await socialStudioService.listCalendar(WORKSPACE_ID, {
        month: String(calendarMonth + 1),
        year: String(calendarYear),
      });
      setCalendarEntries(data ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load calendar", variant: "destructive" });
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarMonth, calendarYear, addToast]);

  const fetchHashtags = useCallback(async () => {
    try {
      setHashtagsLoading(true);
      const data = await socialStudioService.listHashtags(WORKSPACE_ID);
      setHashtags(data ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load hashtags", variant: "destructive" });
    } finally {
      setHashtagsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (tab === "campaigns") fetchCampaigns();
    if (tab === "calendar") fetchCalendar();
    if (tab === "hashtags") fetchHashtags();
  }, [tab, fetchCampaigns, fetchCalendar, fetchHashtags]);

  const handleDeletePost = async (postId: string) => {
    try {
      setActionLoading(postId);
      await socialStudioService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setPostsTotal((prev) => prev - 1);
      addToast({ title: "Deleted", description: "Post deleted successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicatePost = async (postId: string) => {
    try {
      setActionLoading(postId);
      const duplicated = await socialStudioService.duplicatePost(postId);
      setPosts((prev) => [duplicated, ...prev]);
      setPostsTotal((prev) => prev + 1);
      addToast({ title: "Duplicated", description: "Post duplicated successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to duplicate post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      setActionLoading(postId);
      await socialStudioService.publishPost(postId);
      await fetchPosts();
      addToast({ title: "Published", description: "Post published successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to publish post", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return;
    try {
      setCreatingCampaign(true);
      const platforms = newCampaign.platforms
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      await socialStudioService.createCampaign({
        workspace_id: WORKSPACE_ID,
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        platforms: platforms.length > 0 ? platforms : undefined,
      });
      setCampaignDialogOpen(false);
      setNewCampaign({ name: "", description: "", platforms: "" });
      await fetchCampaigns();
      await fetchStats();
      addToast({ title: "Created", description: "Campaign created successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleAddHashtag = async () => {
    if (!newHashtag.trim()) return;
    try {
      setAddingHashtag(true);
      await socialStudioService.createHashtag({
        workspace_id: WORKSPACE_ID,
        tag: newHashtag.startsWith("#") ? newHashtag : `#${newHashtag}`,
        category: newHashtagCategory || undefined,
      });
      setNewHashtag("");
      setNewHashtagCategory("");
      await fetchHashtags();
      addToast({ title: "Added", description: "Hashtag added successfully", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to add hashtag", variant: "destructive" });
    } finally {
      setAddingHashtag(false);
    }
  };

  const handleDeleteHashtag = async (hashtagId: string) => {
    try {
      await socialStudioService.deleteHashtag(hashtagId);
      setHashtags((prev) => prev.filter((h) => h.id !== hashtagId));
      addToast({ title: "Deleted", description: "Hashtag deleted", variant: "success" });
    } catch {
      addToast({ title: "Error", description: "Failed to delete hashtag", variant: "destructive" });
    }
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  };

  const calendarDays = getDaysInMonth(calendarYear, calendarMonth);
  const calendarStartDay = getFirstDayOfMonth(calendarYear, calendarMonth);
  const calendarCells = Array.from({ length: calendarStartDay + calendarDays }, (_, i) => {
    if (i < calendarStartDay) return null;
    const day = i - calendarStartDay + 1;
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEntries = calendarEntries.filter((e) => e.date === dateStr);
    return { day, dateStr, entries: dayEntries };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Studio</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and schedule social media content
          </p>
        </div>
        <Link href="/social-studio/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Posts", value: stats.total_posts, icon: FileText },
            { label: "Published", value: stats?.by_status?.published ?? 0, icon: Send },
            { label: "AI Generated", value: stats.ai_generated_count, icon: Sparkles },
            { label: "Campaigns", value: stats.total_campaigns, icon: Megaphone },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
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
          <TabsTrigger value="posts">
            <FileText className="mr-1 h-4 w-4" /> Posts
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="mr-1 h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-1 h-4 w-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            <Hash className="mr-1 h-4 w-4" /> Hashtags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPostsPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPostsPage(1); }}>
                <SelectTrigger className="w-[140px]" aria-label="Filter by platform">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPostsPage(1); }}>
                <SelectTrigger className="w-[130px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={postTypeFilter} onValueChange={(v) => { setPostTypeFilter(v); setPostsPage(1); }}>
                <SelectTrigger className="w-[150px]" aria-label="Filter by post type">
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {POST_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{postsTotal} posts</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled={postsPage <= 1} onClick={() => setPostsPage(postsPage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {postsPage} of {postsTotalPages}</span>
              <Button variant="ghost" size="sm" disabled={postsPage >= postsTotalPages} onClick={() => setPostsPage(postsPage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first social media post to get started.
                </p>
                <Link href="/social-studio/create">
                  <Button>Create Your First Post</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/social-studio/${post.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getPlatformIcon(post.platform)}</span>
                        <Badge variant="outline" className={`text-xs ${statusColors[post.status] || ""}`}>
                          {post.status}
                        </Badge>
                        {post.ai_generated && (
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
                            <DropdownMenuItem onClick={() => router.push(`/social-studio/${post.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicatePost(post.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {post.status !== "published" && (
                              <DropdownMenuItem onClick={() => handlePublishPost(post.id)}>
                                <Send className="mr-2 h-4 w-4" /> Publish
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
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                    {(post.hashtags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(post.hashtags ?? []).slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            #{tag}
                          </Badge>
                        ))}
                        {(post.hashtags ?? []).length > 4 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            +{(post.hashtags ?? []).length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span className="capitalize">{post.platform}</span>
                        {post.post_type !== "single" && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="capitalize">{post.post_type}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.scheduled_date
                          ? new Date(post.scheduled_date).toLocaleDateString()
                          : new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {actionLoading === post.id && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {postsTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={postsPage <= 1} onClick={() => setPostsPage(postsPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {postsPage} of {postsTotalPages}
              </span>
              <Button variant="outline" size="sm" disabled={postsPage >= postsTotalPages} onClick={() => setPostsPage(postsPage + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{campaigns.length} campaigns</p>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                  <DialogDescription>
                    Group posts together into a campaign for better organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name *</label>
                    <Input
                      placeholder="e.g. Summer Sale 2024"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Input
                      placeholder="Campaign description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Platforms (comma separated)</label>
                    <Input
                      placeholder="e.g. facebook, instagram, twitter"
                      value={newCampaign.platforms}
                      onChange={(e) => setNewCampaign((prev) => ({ ...prev, platforms: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCampaign} disabled={creatingCampaign || !newCampaign.name.trim()}>
                    {creatingCampaign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {campaignsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px]" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Megaphone className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a campaign to organize your posts.
                </p>
                <Button onClick={() => setCampaignDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
                        <Badge variant="outline" className={`text-xs ${campaignStatusColors[campaign.status] || ""}`}>
                          {campaign.status}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground truncate">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {(campaign.platforms ?? []).length > 0 && (
                          <span className="flex items-center gap-1">
                            {(campaign.platforms ?? []).map((p) => getPlatformIcon(p)).join(" ")}
                          </span>
                        )}
                        <span>{campaign.post_count} posts</span>
                        {campaign.start_date && (
                          <span>
                            {new Date(campaign.start_date).toLocaleDateString()}
                            {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateCalendar(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateCalendar(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {calendarLoading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {calendarCells.map((cell, idx) => (
                <div
                  key={idx}
                  className={`min-h-[100px] border rounded-md p-1.5 ${cell ? "bg-background" : "bg-muted/30"}`}
                >
                  {cell && (
                    <>
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        {cell.day}
                      </span>
                      {cell.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${statusColors[entry.status] || "bg-muted"}`}
                          title={`${entry.platform} - ${entry.status}`}
                        >
                          {getPlatformIcon(entry.platform)} {entry.platform}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {calendarEntries.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2">Scheduled This Month</h4>
                <div className="space-y-2">
                  {calendarEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-sm">
                      <span>{getPlatformIcon(entry.platform)}</span>
                      <span className="capitalize">{entry.platform}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[entry.status] || ""}`}>
                        {entry.status}
                      </Badge>
                      <span className="text-muted-foreground text-xs ml-auto">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Add a hashtag (e.g. marketing)"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddHashtag()}
              />
              <Input
                placeholder="Category (optional)"
                value={newHashtagCategory}
                onChange={(e) => setNewHashtagCategory(e.target.value)}
                className="w-[180px]"
                onKeyDown={(e) => e.key === "Enter" && handleAddHashtag()}
              />
              <Button onClick={handleAddHashtag} disabled={addingHashtag || !newHashtag.trim()}>
                {addingHashtag ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                Add
              </Button>
            </div>
          </div>

          {hashtagsLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[60px]" />
              ))}
            </div>
          ) : hashtags.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Hash className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No hashtags yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add hashtags to track and reuse across your posts.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {hashtags.map((hashtag) => (
                <Card key={hashtag.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium text-sm">{hashtag.tag}</span>
                        {hashtag.category && (
                          <Badge variant="secondary" className="text-[10px] ml-2">{hashtag.category}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{hashtag.usage_count} uses</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteHashtag(hashtag.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
