"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  Calendar,
  FileText,
  Heart,
  Archive,
  Copy,
  FolderOpen,
  Tag,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Star,
  Clock,
} from "lucide-react";
import {
  contentStudioService,
  CONTENT_TYPES,
  CONTENT_CATEGORIES,
  type ContentItem,
  type ContentType,
} from "@/services/content-studio";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
};

const contentTypeIcons: Record<string, string> = {
  blog_post: "📝",
  product_description: "🏷️",
  landing_page_copy: "🌐",
  website_copy: "🌐",
  service_page: "🏢",
  about_us: "ℹ️",
  email_campaign: "📧",
  cold_email: "✉️",
  newsletter: "📰",
  facebook_ad: "📘",
  instagram_caption: "📸",
  linkedin_post: "💼",
  twitter_post: "🐦",
  google_ad: "🔍",
  youtube_title: "🎬",
  youtube_description: "🎬",
  video_script: "🎥",
  faq: "❓",
  tagline: "✨",
  headline: "📰",
  cta: "👆",
  meta_title: "🏷️",
  meta_description: "📝",
  press_release: "📰",
  case_study: "📊",
  sales_letter: "💰",
};

export default function ContentStudioPage() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const workspaceId = "default-workspace";

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contentStudioService.listContent(workspaceId, {
        content_type: contentTypeFilter === "all" ? undefined : contentTypeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        is_archived: showArchived || undefined,
        is_favorite: showFavoritesOnly || undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 12,
      });
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.total_pages ?? 1);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, contentTypeFilter, statusFilter, showArchived, showFavoritesOnly, search, sortBy, sortOrder, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async (id: string) => {
    try {
      await contentStudioService.deleteContent(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await contentStudioService.duplicateContent(id);
      setItems((prev) => [duplicated, ...prev]);
      setTotal((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to duplicate:", err);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const result = await contentStudioService.toggleFavorite(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_favorite: result.is_favorite } : item
        )
      );
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      const result = await contentStudioService.toggleArchive(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_archived: result.is_archived } : item
        )
      );
      if (showArchived) {
        loadItems();
      }
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const contentTypes = Object.entries(CONTENT_TYPES);
  const uniqueTypes = [...new Set(contentTypes.map(([, v]) => v.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Studio</h1>
          <p className="text-muted-foreground">
            Generate, edit, and manage all your marketing content with AI.
          </p>
        </div>
        <Link href="/content-studio/create">
          <Button aria-label="Create new content">
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label="Search content"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={contentTypeFilter} onValueChange={(v) => { setContentTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by content type">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((cat) => (
                <SelectItem key={cat} value={cat} disabled>
                  {CONTENT_CATEGORIES[cat as keyof typeof CONTENT_CATEGORIES] || cat}
                </SelectItem>
              ))}
              {contentTypes.map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {contentTypeIcons[key]} {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[130px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Updated</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="word_count">Word Count</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="icon"
            onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setPage(1); }}
            aria-label="Toggle favorites"
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
          </Button>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="icon"
            onClick={() => { setShowArchived(!showArchived); setPage(1); }}
            aria-label="Toggle archived"
          >
            <Archive className="h-4 w-4" />
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} items</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-48 bg-muted rounded mb-3" />
                <div className="h-3 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No content yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating AI-powered marketing content.
            </p>
            <Link href="/content-studio/create">
              <Button>Create Your First Content</Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{contentTypeIcons[item.content_type] || "📄"}</span>
                        <Badge variant="outline" className={`text-xs ${statusColors[item.status] || ""}`}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleToggleFavorite(item.id)}
                          aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={`h-3.5 w-3.5 ${item.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/content-studio/${item.id}/editor`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/content-studio/${item.id}/editor`)}>
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(item.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/content-studio/${item.id}/versions`)}>
                              <Clock className="mr-2 h-4 w-4" /> Versions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/content-studio/${item.id}/export`)}>
                              <Archive className="mr-2 h-4 w-4" /> Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleArchive(item.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              {item.is_archived ? "Unarchive" : "Archive"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {item.plain_body?.slice(0, 100) || "No content yet"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{item.word_count} words</span>
                        <span>v{item.current_version}</span>
                      </div>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-xl">{contentTypeIcons[item.content_type] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {CONTENT_TYPES[item.content_type as ContentType]?.label || item.content_type}
                    {" · "}
                    {item.word_count} words
                    {" · "}
                    v{item.current_version}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs ${statusColors[item.status] || ""}`}>
                  {item.status}
                </Badge>
                {item.is_favorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/content-studio/${item.id}/editor`)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDuplicate(item.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/content-studio/${item.id}/versions`)}>
                        <Clock className="mr-2 h-4 w-4" /> Versions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleArchive(item.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        {item.is_archived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
