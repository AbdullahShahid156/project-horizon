"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { imageStudioService, type ImageFolder } from "@/services/image-studio";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  Wand,
  Palette,
} from "lucide-react";

const STYLES = [
  "Photorealistic", "Digital Art", "Oil Painting", "Watercolor", "Sketch",
  "3D Render", "Pixel Art", "Flat Design", "Isometric", "Minimalist",
  "Abstract", "Vintage", "Anime", "Comic Book", "Cinematic",
];

const ASPECT_RATIOS = [
  { label: "1:1 Square", width: 1024, height: 1024 },
  { label: "16:9 Landscape", width: 1792, height: 1024 },
  { label: "9:16 Portrait", width: 1024, height: 1792 },
  { label: "4:3 Standard", width: 1365, height: 1024 },
  { label: "3:4 Tall", width: 1024, height: 1365 },
  { label: "21:9 Ultra-wide", width: 2150, height: 921 },
];

const IMAGE_TYPES = [
  { value: "hero", label: "Hero Image", desc: "Large banner for landing pages" },
  { value: "product", label: "Product Image", desc: "Showcase your products" },
  { value: "blog", label: "Blog Image", desc: "Featured images for articles" },
  { value: "landing-page", label: "Landing Page", desc: "Conversion-focused visuals" },
  { value: "social-media", label: "Social Media", desc: "Posts and stories" },
  { value: "background", label: "Background", desc: "Website and app backgrounds" },
  { value: "icon", label: "Icon", desc: "App and website icons" },
  { value: "illustration", label: "Illustration", desc: "Custom illustrations" },
  { value: "general", label: "General", desc: "Any type of image" },
];

export default function ImageGeneratePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState("");
  const [imageType, setImageType] = useState("general");
  const [selectedRatio, setSelectedRatio] = useState(0);
  const [numVariations, setNumVariations] = useState(1);
  const [folderId, setFolderId] = useState("");
  const [name, setName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; name: string; width: number; height: number }>>([]);

  useEffect(() => {
    imageStudioService.listFolders("ws-default").then((f) => setFolders(f ?? [])).catch(() => {});
  }, []);

  const handleEnhancePrompt = async () => {
    if (!prompt) return;
    try {
      setIsEnhancing(true);
      const result = await imageStudioService.enhancePrompt({
        prompt,
        style: style || undefined,
        image_type: imageType || undefined,
      });
      setPrompt(result.enhanced);
      addToast({ title: "Prompt enhanced", description: "AI has improved your prompt" });
    } catch {
      addToast({ title: "Error", description: "Failed to enhance prompt", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      addToast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }
    try {
      setIsGenerating(true);
      const ratio = ASPECT_RATIOS[selectedRatio];
      const result = await imageStudioService.generateImage({
        workspace_id: "ws-default",
        prompt,
        negative_prompt: negativePrompt || undefined,
        style: style || undefined,
        width: ratio.width,
        height: ratio.height,
        image_type: imageType,
        folder_id: folderId || undefined,
        name: name || undefined,
        num_variations: numVariations,
      });
      setGeneratedImages((result?.images ?? []).map((img) => ({ id: img.id, name: img.name, width: img.width || 1024, height: img.height || 1024 })));
      addToast({ title: "Images generated", description: `${(result?.images ?? []).length} image(s) created in ${result?.latency_ms?.toFixed(0) ?? "0"}ms` });
    } catch {
      addToast({ title: "Error", description: "Failed to generate images", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold">Generate Images</h1>
          <p className="text-muted-foreground mt-1">Create AI-powered images from text prompts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Prompt</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Image Prompt *</label>
                <Textarea placeholder="A futuristic cityscape at sunset with flying cars and neon lights..." value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
                <Button variant="outline" size="sm" className="mt-2" onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt}>
                  {isEnhancing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />} Enhance Prompt
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Negative Prompt</label>
                <Textarea placeholder="blurry, low quality, distorted, watermark..." value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image Name</label>
                <Input placeholder="My awesome image" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Style</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <Badge key={s} variant={style === s ? "default" : "outline"} className="cursor-pointer" onClick={() => setStyle(style === s ? "" : s)}>{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aspect Ratio</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio, i) => (
                  <div key={i} className={`p-3 border rounded-lg cursor-pointer text-center ${selectedRatio === i ? "border-primary bg-primary/5" : ""}`} onClick={() => setSelectedRatio(i)}>
                    <div className="w-full aspect-video bg-muted rounded mb-2 flex items-center justify-center" style={{ aspectRatio: `${ratio.width}/${ratio.height}` }}>
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium">{ratio.label}</p>
                    <p className="text-xs text-muted-foreground">{ratio.width}×{ratio.height}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Image Type</label>
                <div className="space-y-1">
                  {IMAGE_TYPES.map((t) => (
                    <div key={t.value} className={`p-2 rounded cursor-pointer text-sm ${imageType === t.value ? "bg-primary/10 text-primary" : "hover:bg-muted"}`} onClick={() => setImageType(t.value)}>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Variations: {numVariations}</label>
                <input type="range" min={1} max={4} value={numVariations} onChange={(e) => setNumVariations(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Folder</label>
                <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-background">
                  <option value="">No folder</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isGenerating || !prompt}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate Image"}
          </Button>

          {generatedImages.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Generated Images</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {generatedImages.map((img) => (
                  <div key={img.id} className="p-2 border rounded flex items-center gap-2 cursor-pointer hover:bg-muted" onClick={() => router.push(`/image-studio/${img.id}`)}>
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{img.name}</p>
                      <p className="text-xs text-muted-foreground">{img.width}×{img.height}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
