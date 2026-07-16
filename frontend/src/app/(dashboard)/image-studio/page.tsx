"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { imageStudioService, type ImageItem, type ImageFolder, type ImageStats } from "@/services/image-studio";
import {
  Plus,
  Search,
  Heart,
  Trash2,
  MoreHorizontal,
  Download,
  Eye,
  Copy,
  FolderOpen,
  Grid,
  List,
  Image as ImageIcon,
  Upload,
  Sparkles,
  FolderPlus,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

const IMAGE_TYPES = ["hero", "product", "blog", "landing-page", "social-media", "background", "icon", "illustration", "general"];

export default function ImageStudioPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFolder, setFilterFolder] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const result = await imageStudioService.listImages("ws-default", {
        search,
        image_type: filterType || undefined,
        folder_id: filterFolder || undefined,
        is_favorite: showFavorites || undefined,
        is_deleted: tab === "trash" || undefined,
        page,
        page_size: 12,
      });
      setImages(result?.items ?? []);
      setTotalPages(result?.total_pages ?? 1);
      const s = await imageStudioService.getStats("ws-default");
      setStats(s ?? null);
      const f = await imageStudioService.listFolders("ws-default");
      setFolders(f ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load images", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterFolder, showFavorites, tab, page, addToast]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await imageStudioService.uploadImage("ws-default", file, file.name.replace(/\.[^.]+$/, ""));
      addToast({ title: "Uploaded", description: "Image uploaded successfully" });
      fetchImages();
    } catch {
      addToast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAction = async (imageId: string, action: string) => {
    try {
      setActionLoading(imageId);
      switch (action) {
        case "favorite": await imageStudioService.toggleFavorite(imageId); break;
        case "delete": await imageStudioService.deleteImage(imageId); break;
        case "restore": await imageStudioService.restoreImage(imageId); break;
      }
      addToast({ title: "Success", description: `Image ${action === "delete" ? "deleted" : action === "restore" ? "restored" : "updated"}` });
      fetchImages();
    } catch {
      addToast({ title: "Error", description: `Failed to ${action} image`, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Image Studio</h1>
          <p className="text-muted-foreground mt-1">Generate, manage, and edit AI images</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
          </Button>
          <Button onClick={() => router.push("/image-studio/generate")}><Sparkles className="mr-2 h-4 w-4" /> Generate</Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Images", value: stats?.total ?? 0 },
            { label: "Favorites", value: stats?.favorites ?? 0 },
            { label: "Total Size", value: formatSize(stats?.total_size_bytes ?? 0) },
            { label: "Types", value: Object.keys(stats?.by_type ?? {}).length },
            { label: "Folders", value: folders?.length ?? 0 },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All Images</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="trash">Trash</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search images..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm bg-background">
              <option value="">All Types</option>
              {IMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterFolder} onChange={(e) => { setFilterFolder(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm bg-background">
              <option value="">All Folders</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div className="flex gap-2">
              <Button variant={showFavorites ? "default" : "outline"} size="sm" onClick={() => { setShowFavorites(!showFavorites); setPage(1); }}>
                <Heart className="mr-1 h-3 w-3" /> Favorites
              </Button>
              <div className="border rounded-md flex">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><Grid className="h-3 w-3" /></Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
          {loading ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-16"} />)}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No images found</h3>
              <p className="text-muted-foreground mb-4">Generate or upload your first image</p>
              <Button onClick={() => router.push("/image-studio/generate")}><Sparkles className="mr-2 h-4 w-4" /> Generate Image</Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="group hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => router.push(`/image-studio/${image.id}`)}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => handleAction(image.id, "favorite")}>
                        <Heart className={`h-3 w-3 ${image.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="flex-1 h-7 text-xs" onClick={() => router.push(`/image-studio/${image.id}`)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{image.image_type}</Badge>
                      <span className="text-xs text-muted-foreground">{image.width}×{image.height}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((image) => (
                <Card key={image.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => router.push(`/image-studio/${image.id}`)}>
                  <CardContent className="p-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{image.name}</p>
                      <p className="text-sm text-muted-foreground">{image.width}×{image.height} · {formatSize(image.file_size)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{image.image_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(image.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleAction(image.id, "favorite")}>
                        <Heart className={`h-3.5 w-3.5 ${image.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/image-studio/${image.id}`)}><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(image.id, "restore")}><Download className="mr-2 h-3.5 w-3.5" /> Download</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction(image.id, "delete")} className="text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {images.filter((i) => i.is_favorite).length === 0 ? (
            <div className="text-center py-12"><Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No favorite images</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.filter((i) => i.is_favorite).map((image) => (
                <Card key={image.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => router.push(`/image-studio/${image.id}`)}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="h-12 w-12 text-muted-foreground/50" /></div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{image.image_type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trash" className="space-y-4">
          {images.filter((i) => i.is_deleted).length === 0 ? (
            <div className="text-center py-12"><Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Trash is empty</p></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.filter((i) => i.is_deleted).map((image) => (
                <Card key={image.id} className="hover:shadow-md transition-shadow overflow-hidden opacity-60" onClick={() => router.push(`/image-studio/${image.id}`)}>
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="h-12 w-12 text-muted-foreground/50" /></div>
                  </div>
                  <CardContent className="p-3 flex justify-between items-center">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleAction(image.id, "restore"); }}>Restore</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => router.push("/image-studio/folders")}><FolderPlus className="mr-1 h-3 w-3" /> Manage Folders</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setFilterFolder(folder.id); setTab("all"); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <FolderOpen className="h-8 w-8" style={{ color: folder.color || "#6366F1" }} />
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{folder.image_count} images</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {totalPages > 1 && tab === "all" && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="py-2 px-4 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
