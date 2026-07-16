"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { brandStudioService, type Brand, type BrandStats } from "@/services/brand-studio";
import {
  Plus,
  Search,
  Heart,
  Archive,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  Edit,
  Star,
  Palette,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
  Loader2,
} from "lucide-react";

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "E-commerce",
  "Food & Beverage", "Real Estate", "Travel", "Entertainment", "Manufacturing",
  "Retail", "Automotive", "Energy", "Agriculture", "Other",
];

export default function BrandStudioPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const result = await brandStudioService.listBrands("ws-default", {
        search,
        is_archived: showArchived || undefined,
        is_favorite: showFavorites || undefined,
        industry: filterIndustry || undefined,
        page,
        page_size: 12,
      });
      setBrands(result?.items ?? []);
      setTotalPages(result?.total_pages ?? 1);
      const s = await brandStudioService.getStats("ws-default");
      setStats(s ?? null);
    } catch {
      addToast({ title: "Error", description: "Failed to load brands", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, showArchived, showFavorites, filterIndustry, page, addToast]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleAction = async (brandId: string, action: string) => {
    try {
      setActionLoading(brandId);
      switch (action) {
        case "favorite": await brandStudioService.toggleFavorite(brandId); break;
        case "archive": await brandStudioService.toggleArchive(brandId); break;
        case "duplicate": await brandStudioService.duplicateBrand(brandId); break;
        case "delete": await brandStudioService.deleteBrand(brandId); break;
      }
      addToast({ title: "Success", description: `Brand ${action}d` });
      fetchBrands();
    } catch {
      addToast({ title: "Error", description: `Failed to ${action} brand`, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Studio</h1>
          <p className="text-muted-foreground mt-1">Create and manage your brand identities</p>
        </div>
        <Button onClick={() => router.push("/brand-studio/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Brand
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Brands", value: stats?.total ?? 0, icon: Palette },
            { label: "Favorites", value: stats?.favorites ?? 0, icon: Heart },
            { label: "Archived", value: stats?.archived ?? 0, icon: Archive },
            { label: "Industries", value: Object.keys(stats?.by_industry ?? {}).length, icon: Building2 },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-4 w-4 text-primary" /></div>
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search brands..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <select value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm bg-background">
          <option value="">All Industries</option>
          {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
        </select>
        <div className="flex gap-2">
          <Button variant={showFavorites ? "default" : "outline"} size="sm" onClick={() => { setShowFavorites(!showFavorites); setPage(1); }}>
            <Heart className="mr-1 h-3 w-3" /> Favorites
          </Button>
          <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => { setShowArchived(!showArchived); setPage(1); }}>
            <Archive className="mr-1 h-3 w-3" /> Archived
          </Button>
          <div className="border rounded-md flex">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="h-3 w-3" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-16"} />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No brands found</h3>
          <p className="text-muted-foreground mb-4">Create your first brand to get started</p>
          <Button onClick={() => router.push("/brand-studio/create")}><Plus className="mr-2 h-4 w-4" /> Create Brand</Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Card key={brand.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/brand-studio/${brand.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{brand.name}</h3>
                    {brand.tagline && <p className="text-sm text-muted-foreground truncate">{brand.tagline}</p>}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAction(brand.id, "favorite")}>
                      <Heart className={`h-4 w-4 ${brand.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/brand-studio/${brand.id}`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/brand-studio/${brand.id}/preview`)}><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(brand.id, "duplicate")}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(brand.id, "archive")}>
                          <Archive className="mr-2 h-4 w-4" /> {brand.is_archived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction(brand.id, "delete")} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: brand.primary_color }} />
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: brand.secondary_color }} />
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: brand.accent_color }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {brand.industry && <Badge variant="secondary" className="text-xs">{brand.industry}</Badge>}
                  <Badge variant="outline" className="text-xs">v{brand.current_version}</Badge>
                  {brand.brand_keywords && brand.brand_keywords.slice(0, 2).map((kw: string) => (
                    <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {brands.map((brand) => (
            <Card key={brand.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => router.push(`/brand-studio/${brand.id}`)}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.primary_color }} />
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.secondary_color }} />
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brand.accent_color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{brand.tagline || brand.industry || "No tagline"}</p>
                </div>
                <Badge variant="outline" className="text-xs">v{brand.current_version}</Badge>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleAction(brand.id, "favorite")}>
                    <Heart className={`h-4 w-4 ${brand.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/brand-studio/${brand.id}/preview`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="py-2 px-4 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
