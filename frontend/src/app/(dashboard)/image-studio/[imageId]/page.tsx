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
import { imageStudioService, type ImageItem, type ImageFolder, type ImageHistoryEntry } from "@/services/image-studio";
import {
  ArrowLeft,
  Save,
  Trash2,
  Heart,
  Loader2,
  Wand2,
  Sparkles,
  History,
  Sliders,
  Tag,
  ZoomIn,
  Maximize,
  ArrowUpDown,
  Download,
  Image as ImageIcon,
} from "lucide-react";

const FILTERS = [
  { value: "brightness", label: "Brightness" },
  { value: "contrast", label: "Contrast" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia" },
  { value: "blur", label: "Blur" },
  { value: "sharpen", label: "Sharpen" },
];

const RESIZE_PRESETS = [
  { label: "Original", width: 0, height: 0 },
  { label: "HD (1280×720)", width: 1280, height: 720 },
  { label: "Full HD (1920×1080)", width: 1920, height: 1080 },
  { label: "Square (512×512)", width: 512, height: 512 },
  { label: "Instagram (1080×1080)", width: 1080, height: 1080 },
  { label: "Twitter (1200×675)", width: 1200, height: 675 },
];

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const imageId = params.imageId as string;
  const [image, setImage] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [history, setHistory] = useState<ImageHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editFolderId, setEditFolderId] = useState("");

  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [compressQuality, setCompressQuality] = useState(85);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [editOperation, setEditOperation] = useState<string | null>(null);

  const fetchImage = useCallback(async () => {
    try {
      const data = await imageStudioService.getImage(imageId);
      setImage(data ?? null);
      setEditName(data?.name ?? "");
      setEditDesc(data?.description || "");
      setEditTags(data?.tags ?? []);
      setEditFolderId(data?.folder_id || "");
      setResizeWidth(data?.width ?? 1024);
      setResizeHeight(data?.height ?? 1024);
      const f = await imageStudioService.listFolders("ws-default");
      setFolders(f ?? []);
    } catch {
      addToast({ title: "Error", description: "Failed to load image", variant: "destructive" });
      router.push("/image-studio");
    } finally {
      setLoading(false);
    }
  }, [imageId, addToast, router]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await imageStudioService.getImageHistory(imageId);
      setHistory(data ?? []);
    } catch { /* ignore */ } finally {
      setHistoryLoading(false);
    }
  }, [imageId]);

  useEffect(() => { fetchImage(); fetchHistory(); }, [fetchImage, fetchHistory]);

  const handleSaveDetails = async () => {
    if (!image) return;
    try {
      setSaving(true);
      await imageStudioService.updateImage(imageId, {
        name: editName,
        description: editDesc || undefined,
        tags: editTags.length > 0 ? editTags : undefined,
        folder_id: editFolderId || undefined,
      });
      addToast({ title: "Saved", description: "Image details updated" });
      fetchImage();
    } catch {
      addToast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!image) return;
    try {
      const result = await imageStudioService.toggleFavorite(imageId);
      setImage((prev) => prev ? { ...prev, is_favorite: result.is_favorite } : prev);
      addToast({ title: result.is_favorite ? "Added to favorites" : "Removed from favorites" });
    } catch {
      addToast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await imageStudioService.deleteImage(imageId);
      addToast({ title: "Deleted", description: "Image moved to trash" });
      router.push("/image-studio");
    } catch {
      addToast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleEdit = async (operation: string, outputFormat?: string) => {
    if (!image) return;
    try {
      setEditing(true);
      setEditOperation(operation);
      const editParams: Parameters<typeof imageStudioService.editImage>[0] = { image_id: imageId, operation };
      if (operation === "resize") { editParams.width = resizeWidth; editParams.height = resizeHeight; }
      if (operation === "compress") { editParams.quality = compressQuality; }
      if (operation === "filter") { editParams.filter_name = selectedFilter; }
      if (operation === "convert" && outputFormat) { editParams.output_format = outputFormat; }
      await imageStudioService.editImage(editParams);
      addToast({ title: "Edit applied", description: `${operation} completed` });
      fetchImage();
      fetchHistory();
    } catch {
      addToast({ title: "Error", description: `Failed to ${operation}`, variant: "destructive" });
    } finally {
      setEditing(false);
      setEditOperation(null);
    }
  };

  const handleDownload = () => {
    if (!image?.url) return;
    const link = document.createElement("a");
    link.href = image.url;
    const ext = image.format || (image.url.includes("webp") ? "webp" : image.url.includes("jpeg") || image.url.includes("jpg") ? "jpg" : "png");
    link.download = `${image.name || "image"}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVariations = async () => {
    if (!image) return;
    try {
      setOptimizing(true);
      const result = await imageStudioService.generateVariations({ image_id: imageId, num_variations: 4 });
      addToast({ title: "Variations generated", description: `${(result?.images ?? []).length} variations created` });
      fetchHistory();
    } catch {
      addToast({ title: "Error", description: "Failed to generate variations", variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpscale = async () => {
    if (!image) return;
    try {
      setOptimizing(true);
      await imageStudioService.upscaleImage({ image_id: imageId, scale: 2 });
      addToast({ title: "Upscaled", description: "Image has been upscaled" });
      fetchImage();
    } catch {
      addToast({ title: "Error", description: "Failed to upscale", variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96" /></div>;
  }

  if (!image) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold">{image.name}</h1>
            <p className="text-muted-foreground mt-1">{image.width}×{image.height} · {image.format.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
            <Heart className={`mr-1 h-4 w-4 ${image.is_favorite ? "fill-red-500 text-red-500" : ""}`} /> {image.is_favorite ? "Favorited" : "Favorite"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center relative overflow-hidden">
              {image.url ? (
                <img src={image.url} alt={image.name} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant="secondary">{image.image_type}</Badge>
                {image.style && <Badge variant="outline">{image.style}</Badge>}
                <Button variant="secondary" size="sm" className="h-7 gap-1" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          </Card>

          {image.prompt && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Generation Prompt</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{image.prompt}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1"><Tag className="mr-1 h-3 w-3" /> Details</TabsTrigger>
              <TabsTrigger value="edit" className="flex-1"><Sliders className="mr-1 h-3 w-3" /> Edit</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1"><Sparkles className="mr-1 h-3 w-3" /> AI</TabsTrigger>
              <TabsTrigger value="history" className="flex-1"><History className="mr-1 h-3 w-3" /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tags</label>
                    <div className="flex gap-2">
                      <Input placeholder="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                      <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editTags.map((t) => (
                        <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setEditTags(editTags.filter((x) => x !== t))}>{t} ×</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Folder</label>
                    <select value={editFolderId} onChange={(e) => setEditFolderId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                      <option value="">No folder</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <Button className="w-full" onClick={handleSaveDetails} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Resize</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Width</label>
                      <Input type="number" value={resizeWidth} onChange={(e) => setResizeWidth(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Height</label>
                      <Input type="number" value={resizeHeight} onChange={(e) => setResizeHeight(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {RESIZE_PRESETS.map((p) => (
                      <Badge key={p.label} variant="outline" className="cursor-pointer text-xs" onClick={() => { if (p.width) { setResizeWidth(p.width); setResizeHeight(p.height); } else { setResizeWidth(image.width || 1024); setResizeHeight(image.height || 1024); } }}>{p.label}</Badge>
                    ))}
                  </div>
                  <Button className="w-full" size="sm" onClick={() => handleEdit("resize")} disabled={editing}>
                    {editing && editOperation === "resize" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Maximize className="mr-1 h-3 w-3" />} Resize
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Compress</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Quality: {compressQuality}%</label>
                    <input type="range" min={10} max={100} value={compressQuality} onChange={(e) => setCompressQuality(Number(e.target.value))} className="w-full" />
                  </div>
                  <Button className="w-full" size="sm" onClick={() => handleEdit("compress")} disabled={editing}>
                    {editing && editOperation === "compress" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ArrowUpDown className="mr-1 h-3 w-3" />} Compress
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Filters</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {FILTERS.map((f) => (
                      <Badge key={f.value} variant={selectedFilter === f.value ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedFilter(f.value)}>{f.label}</Badge>
                    ))}
                  </div>
                  <Button className="w-full" size="sm" onClick={() => handleEdit("filter")} disabled={editing || !selectedFilter}>
                    {editing && editOperation === "filter" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />} Apply Filter
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Convert</CardTitle></CardHeader>
                <CardContent className="flex gap-2">
                  {["webp", "png", "jpg"].map((fmt) => (
                    <Button key={fmt} variant="outline" size="sm" className="flex-1" onClick={() => handleEdit("convert", fmt)} disabled={editing}>
                      {editing && editOperation === "convert" ? <Loader2 className="h-3 w-3 animate-spin" /> : `to ${fmt.toUpperCase()}`}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">AI Variations</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Generate similar variations of this image</p>
                  <Button className="w-full" onClick={handleVariations} disabled={optimizing}>
                    {optimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate 4 Variations
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">AI Upscale</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Increase resolution by 2x using AI</p>
                  <Button className="w-full" onClick={handleUpscale} disabled={optimizing}>
                    {optimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ZoomIn className="mr-2 h-4 w-4" />} Upscale 2x
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Edit History</CardTitle></CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No history yet</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((h) => (
                        <div key={h.id} className="p-2 border rounded text-sm">
                          <div className="flex justify-between">
                            <Badge variant="secondary">{h.action}</Badge>
                            <span className="text-xs text-muted-foreground">{h.latency_ms?.toFixed(0)}ms</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(h.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
