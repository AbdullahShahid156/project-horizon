"use client";

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, FileText, Globe, Image, Mail, Megaphone, Palette, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "project" | "landing-page" | "content" | "image" | "email" | "campaign" | "brand";
  url: string;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  project: <Globe className="h-4 w-4" />,
  "landing-page": <FileText className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  image: <Image alt="" className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  campaign: <Megaphone className="h-4 w-4" />,
  brand: <Palette className="h-4 w-4" />,
};

const DEMO_ITEMS: SearchResult[] = [
  { id: "1", title: "Default Project", description: "Main workspace project", type: "project", url: "/projects" },
  { id: "2", title: "Product Launch Landing Page", description: "High-converting landing page", type: "landing-page", url: "/landing-pages" },
  { id: "3", title: "Brand Guidelines", description: "Company brand identity", type: "brand", url: "/brand-studio" },
  { id: "4", title: "Welcome Email Template", description: "Onboarding email sequence", type: "email", url: "/email-studio" },
  { id: "5", title: "Social Media Campaign", description: "Q4 marketing campaign", type: "campaign", url: "/social-studio" },
  { id: "6", title: "Hero Banner Image", description: "Website hero section image", type: "image", url: "/image-studio" },
  { id: "7", title: "About Us Page Content", description: "Company description and values", type: "content", url: "/content-studio" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    setResults(
      DEMO_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.type.toLowerCase().includes(lower)
      )
    );
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground text-sm">Search across all your projects and content</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects, pages, content..."
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <Link key={r.id} href={r.url}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="text-muted-foreground">{TYPE_ICONS[r.type]}</div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{r.title}</span>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {r.type.replace("-", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!query && (
        <Card>
          <CardContent className="py-12 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Type to search across your workspace</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
