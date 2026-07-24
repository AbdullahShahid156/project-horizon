"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Search,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Link2,
  FileText,
  BarChart3,
  Target,
  Wrench,
  Layout,
  FileJson,
  Users,
  History,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import {
  seoStudioService,
  type SEODomain,
  type SEODashboard,
  type SEOAudit,
  type SEOKeyword,
  type SEOOnPageResult,
  type SEOTechnicalResult,
  type SEOContentOptimizeResult,
  type SEOSchema,
  type SEOReport,
  type SEORecommendation,
  type SEOCompetitor,
  type SEOInternalLink,
  type SEOHistoryItem,
  type SEOCompetitorAnalysis,
} from "@/services/seo-studio";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score}, 100`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{score}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function SEODomainDashboard() {
  const router = useRouter();
  const params = useParams();
  const domainId = params.domainId as string;

  const [domain, setDomain] = useState<SEODomain | null>(null);
  const [dashboard, setDashboard] = useState<SEODashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [audits, setAudits] = useState<SEOAudit[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [seedKeywords, setSeedKeywords] = useState("");
  const [schemas, setSchemas] = useState<SEOSchema[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaType, setSchemaType] = useState("Organization");
  const [schemaName, setSchemaName] = useState("");
  const [reports, setReports] = useState<SEOReport[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SEORecommendation[]>([]);
  const [competitors, setCompetitors] = useState<SEOCompetitor[]>([]);
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [competitorAnalysis, setCompetitorAnalysis] = useState<SEOCompetitorAnalysis | null>(null);
  const [competitorAnalyzing, setCompetitorAnalyzing] = useState(false);
  const [history, setHistory] = useState<SEOHistoryItem[]>([]);
  const [internalLinks, setInternalLinks] = useState<SEOInternalLink[]>([]);

  const [onPageUrl, setOnPageUrl] = useState("");
  const [onPageResult, setOnPageResult] = useState<SEOOnPageResult | null>(null);
  const [onPageLoading, setOnPageLoading] = useState(false);

  const [techUrl, setTechUrl] = useState("");
  const [techResult, setTechResult] = useState<SEOTechnicalResult | null>(null);
  const [techLoading, setTechLoading] = useState(false);

  const [contentTitle, setContentTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [contentKeywords, setContentKeywords] = useState("");
  const [contentResult, setContentResult] = useState<SEOContentOptimizeResult | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const loadDomain = useCallback(async () => {
    try {
      const [d, dash] = await Promise.all([
        seoStudioService.getDomain(domainId),
        seoStudioService.getDashboard(domainId),
      ]);
      setDomain(d ?? null);
      setDashboard(dash ?? null);
    } catch (err) {
      console.error("Failed to load domain:", err);
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => { loadDomain(); }, [loadDomain]);

  const loadTabData = useCallback(async (tab: string) => {
    try {
      switch (tab) {
        case "keywords":
          setKeywordLoading(true);
          const kw = await seoStudioService.listKeywords(domainId);
          setKeywords(kw ?? []);
          setKeywordLoading(false);
          break;
        case "schemas":
          setSchemaLoading(true);
          const sc = await seoStudioService.listSchemas(domainId);
          setSchemas(sc ?? []);
          setSchemaLoading(false);
          break;
        case "reports":
          setReportLoading(true);
          const rp = await seoStudioService.listReports(domainId);
          setReports(rp ?? []);
          setReportLoading(false);
          break;
        case "recommendations":
          const recs = await seoStudioService.listRecommendations(domainId);
          setRecommendations(recs ?? []);
          break;
        case "competitors":
          const comps = await seoStudioService.listCompetitors(domainId);
          setCompetitors(comps ?? []);
          break;
        case "history":
          const hist = await seoStudioService.listHistory(domainId);
          setHistory(hist ?? []);
          break;
        case "internal-links":
          const links = await seoStudioService.listInternalLinks(domainId);
          setInternalLinks(links ?? []);
          break;
      }
    } catch (err) {
      console.error("Failed to load tab data:", err);
    }
  }, [domainId]);

  const handleRunAudit = async () => {
    if (!domain) return;
    setAuditLoading(true);
    try {
      const result = await seoStudioService.runAudit(domainId, domain.url);
      setAudits((prev) => [result, ...prev]);
      await loadDomain();
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleGenerateKeywords = async () => {
    const seeds = seedKeywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (seeds.length === 0) return;
    setKeywordLoading(true);
    try {
      const result = await seoStudioService.generateKeywords({ domain_id: domainId, seed_keywords: seeds, count: 20 });
      setKeywords((prev) => [...result, ...prev]);
    } catch (err) {
      console.error("Keyword generation failed:", err);
    } finally {
      setKeywordLoading(false);
    }
  };

  const handleOnPageAnalysis = async () => {
    if (!onPageUrl) return;
    setOnPageLoading(true);
    try {
      const result = await seoStudioService.analyzeOnPage({ url: onPageUrl });
      setOnPageResult(result ?? null);
    } catch (err) {
      console.error("On-page analysis failed:", err);
    } finally {
      setOnPageLoading(false);
    }
  };

  const handleTechnicalAnalysis = async () => {
    if (!techUrl) return;
    setTechLoading(true);
    try {
      const result = await seoStudioService.analyzeTechnical({ url: techUrl });
      setTechResult(result ?? null);
    } catch (err) {
      console.error("Technical analysis failed:", err);
    } finally {
      setTechLoading(false);
    }
  };

  const handleContentOptimize = async () => {
    if (!contentTitle || !contentBody) return;
    setContentLoading(true);
    try {
      const kws = contentKeywords.split(",").map((s) => s.trim()).filter(Boolean);
      const result = await seoStudioService.optimizeContent({ title: contentTitle, body: contentBody, target_keywords: kws });
      setContentResult(result ?? null);
    } catch (err) {
      console.error("Content optimization failed:", err);
    } finally {
      setContentLoading(false);
    }
  };

  const handleGenerateSchema = async () => {
    if (!schemaName) return;
    setSchemaLoading(true);
    try {
      const result = await seoStudioService.generateSchema({ domain_id: domainId, schema_type: schemaType, name: schemaName, data: {} });
      setSchemas((prev) => [result, ...prev]);
      setSchemaName("");
    } catch (err) {
      console.error("Schema generation failed:", err);
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleCreateReport = async () => {
    setReportLoading(true);
    try {
      const result = await seoStudioService.createReport({ domain_id: domainId, title: `SEO Report - ${new Date().toLocaleDateString()}` });
      setReports((prev) => [result, ...prev]);
    } catch (err) {
      console.error("Report creation failed:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!competitorUrl || !competitorName) return;
    try {
      const result = await seoStudioService.addCompetitor({ domain_id: domainId, competitor_url: competitorUrl, competitor_name: competitorName });
      setCompetitors((prev) => [...prev, result]);
      setCompetitorUrl("");
      setCompetitorName("");
    } catch (err) {
      console.error("Failed to add competitor:", err);
    }
  };

  const handleAnalyzeCompetitor = async (url: string) => {
    if (!domain) return;
    setCompetitorAnalyzing(true);
    try {
      const result = await seoStudioService.analyzeCompetitor({ domain_url: domain.url, competitor_url: url });
      setCompetitorAnalysis(result ?? null);
    } catch (err) {
      console.error("Competitor analysis failed:", err);
    } finally {
      setCompetitorAnalyzing(false);
    }
  };

  const handleSuggestLinks = async () => {
    try {
      const links = await seoStudioService.suggestInternalLinks({ domain_id: domainId, url: domain?.url || "" });
      setInternalLinks((prev) => [...(links ?? []), ...prev]);
    } catch (err) {
      console.error("Link suggestion failed:", err);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const result = await seoStudioService.exportDomain(domainId, format);
      const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!domain || !dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Domain not found.</p>
        <Button variant="link" onClick={() => router.push("/seo-studio")}>Back to SEO Studio</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/seo-studio")} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              {domain.name}
            </h1>
            <p className="text-sm text-muted-foreground">{domain.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRunAudit} disabled={auditLoading}>
            {auditLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
            Run Audit
          </Button>
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-[120px]" aria-label="Export">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ScoreRing score={dashboard.health_score} label="Health" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ScoreRing score={dashboard.technical_score} label="Technical" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ScoreRing score={dashboard.content_score} label="Content" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold">{dashboard.total_keywords}</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.total_pages}</p>
                <p className="text-xs text-muted-foreground">Pages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{dashboard.broken_links}</p>
                <p className="text-xs text-muted-foreground">Broken Links</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{dashboard.missing_meta_tags}</p>
                <p className="text-xs text-muted-foreground">Missing Meta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); loadTabData(v); }}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="on-page">On-Page</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="schemas">Schemas</TabsTrigger>
          <TabsTrigger value="internal-links">Links</TabsTrigger>
          <TabsTrigger value="recommendations">Issues</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Issues Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm">Critical</span><Badge className="bg-red-100 text-red-800">{dashboard.issues_summary?.critical || 0}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm">Warnings</span><Badge className="bg-yellow-100 text-yellow-800">{dashboard.issues_summary?.warning || 0}</Badge></div>
                  <div className="flex justify-between"><span className="text-sm">Info</span><Badge className="bg-blue-100 text-blue-800">{dashboard.issues_summary?.info || 0}</Badge></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Schema Coverage</span><span className="font-semibold">{dashboard.schema_coverage}</span></div>
                  <div className="flex justify-between"><span>Indexability</span><span className="font-semibold">{dashboard.indexability}%</span></div>
                  <div className="flex justify-between"><span>Keyword Coverage</span><span className="font-semibold">{dashboard.keyword_coverage}</span></div>
                  <div className="flex justify-between"><span>Total Audits</span><span className="font-semibold">{dashboard.total_audits}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {audits.length > 0 ? (
                  <div className="space-y-2">
                    {audits.slice(0, 3).map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span>Audit: {a.overall_score}/100</span>
                        <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No audits yet. Run your first audit!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="on-page" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" /> On-Page SEO Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter URL to analyze" value={onPageUrl} onChange={(e) => setOnPageUrl(e.target.value)} className="flex-1" />
                <Button onClick={handleOnPageAnalysis} disabled={onPageLoading}>
                  {onPageLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  Analyze
                </Button>
              </div>
              {onPageResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={onPageResult.score} label="On-Page Score" />
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Meta Title</p>
                        <p className="text-sm font-medium">{onPageResult.meta_title}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Meta Description</p>
                        <p className="text-sm font-medium">{onPageResult.meta_description}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Slug</p>
                        <p className="text-sm font-medium">{onPageResult.slug}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Canonical</p>
                        <p className="text-sm font-medium">{onPageResult.canonical}</p>
                      </div>
                    </div>
                  </div>
                  {(onPageResult.recommendations ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                      {(onPageResult.recommendations ?? []).map((rec, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                          <span className={`inline-block w-16 text-xs font-medium ${rec.priority === "high" ? "text-red-600" : rec.priority === "medium" ? "text-yellow-600" : "text-blue-600"}`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="ml-2 font-medium">{rec.title}</span>
                          <p className="text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Technical SEO Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter URL to analyze" value={techUrl} onChange={(e) => setTechUrl(e.target.value)} className="flex-1" />
                <Button onClick={handleTechnicalAnalysis} disabled={techLoading}>
                  {techLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  Analyze
                </Button>
              </div>
              {techResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={techResult.score} label="Technical" />
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {techResult.crawlable ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                        Crawlable
                      </div>
                      <div className="flex items-center gap-1">
                        {techResult.robots_txt ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                        Robots.txt
                      </div>
                      <div className="flex items-center gap-1">
                        {techResult.sitemap ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                        Sitemap
                      </div>
                      <div className="flex items-center gap-1">
                        {techResult.canonical ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                        Canonical
                      </div>
                    </div>
                  </div>
                  {(techResult.issues ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Issues ({(techResult.issues ?? []).length})</h4>
                      {(techResult.issues ?? []).map((issue, i) => (
                        <div key={i} className={`p-3 rounded-lg text-sm ${
                          issue.severity === "critical" ? "bg-red-50 border border-red-200" :
                          issue.severity === "warning" ? "bg-yellow-50 border border-yellow-200" :
                          "bg-blue-50 border border-blue-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            <Badge variant={issue.severity === "critical" ? "destructive" : "outline"} className="text-[10px]">
                              {issue.severity}
                            </Badge>
                            <span className="font-medium">{issue.message}</span>
                          </div>
                          <p className="text-muted-foreground mt-1">{issue.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Content Optimization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Enter page title" />
                </div>
                <div className="space-y-2">
                  <Label>Target Keywords (comma separated)</Label>
                  <Input value={contentKeywords} onChange={(e) => setContentKeywords(e.target.value)} placeholder="keyword1, keyword2" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content Body</Label>
                <Textarea value={contentBody} onChange={(e) => setContentBody(e.target.value)} placeholder="Enter content to optimize..." rows={6} />
              </div>
              <Button onClick={handleContentOptimize} disabled={contentLoading}>
                {contentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Optimize Content
              </Button>
              {contentResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={contentResult.score} label="Content Score" />
                    <div className="flex-1 space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Optimized Title</p>
                        <p className="text-sm font-medium">{contentResult.optimized_title}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Optimized Meta</p>
                        <p className="text-sm font-medium">{contentResult.optimized_meta}</p>
                      </div>
                    </div>
                  </div>
                  {contentResult.readability && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{contentResult.readability.score}</p>
                        <p className="text-xs text-muted-foreground">Readability</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{contentResult.readability.level}</p>
                        <p className="text-xs text-muted-foreground">Level</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{contentResult.readability.avg_sentence_length}</p>
                        <p className="text-xs text-muted-foreground">Avg Sentence</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{Object.keys(contentResult.keyword_density ?? {}).length}</p>
                        <p className="text-xs text-muted-foreground">Keywords</p>
                      </div>
                    </div>
                  )}
                  {(contentResult.suggestions ?? []).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Suggestions</h4>
                      {(contentResult.suggestions ?? []).map((s, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/30 rounded">• {s}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Keyword Research</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Enter seed keywords (comma separated)" value={seedKeywords} onChange={(e) => setSeedKeywords(e.target.value)} className="flex-1" />
                <Button onClick={handleGenerateKeywords} disabled={keywordLoading}>
                  {keywordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Generate
                </Button>
              </div>
              {keywordLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : keywords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Keyword</th>
                        <th className="pb-2 font-medium">Volume</th>
                        <th className="pb-2 font-medium">Difficulty</th>
                        <th className="pb-2 font-medium">CPC</th>
                        <th className="pb-2 font-medium">Intent</th>
                        <th className="pb-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((kw) => (
                        <tr key={kw.id} className="border-b">
                          <td className="py-2 font-medium">{kw.keyword}</td>
                          <td className="py-2">{kw.search_volume.toLocaleString()}</td>
                          <td className="py-2">
                            <Badge variant={kw.difficulty > 70 ? "destructive" : kw.difficulty > 40 ? "default" : "secondary"}>
                              {kw.difficulty}
                            </Badge>
                          </td>
                          <td className="py-2">${kw.cpc.toFixed(2)}</td>
                          <td className="py-2"><Badge variant="outline">{kw.intent}</Badge></td>
                          <td className="py-2"><Badge variant="secondary">{kw.keyword_type}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No keywords yet. Generate some from seed keywords.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schemas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5" /> Schema Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Select value={schemaType} onValueChange={setSchemaType}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Organization", "LocalBusiness", "Product", "FAQ", "Article", "Breadcrumb", "WebSite", "Service", "Person", "Event"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Schema name" value={schemaName} onChange={(e) => setSchemaName(e.target.value)} className="flex-1" />
                <Button onClick={handleGenerateSchema} disabled={schemaLoading || !schemaName}>
                  {schemaLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Generate
                </Button>
              </div>
              {schemas.length > 0 && (
                <div className="space-y-3">
                  {schemas.map((s) => (
                    <div key={s.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{s.schema_type}</Badge>
                          <span className="font-medium">{s.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={async () => { await seoStudioService.deleteSchema(s.id); setSchemas((prev) => prev.filter((x) => x.id !== s.id)); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-40">
                        {JSON.stringify(s.json_ld, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal-links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Internal Linking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSuggestLinks} variant="outline">
                <Sparkles className="h-4 w-4 mr-1" /> Suggest Internal Links
              </Button>
              {internalLinks.length > 0 ? (
                <div className="space-y-2">
                  {internalLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="text-sm">
                        <p className="font-medium">{link.source_url}</p>
                        <p className="text-muted-foreground">→ {link.target_url}</p>
                        <p className="text-xs text-muted-foreground">Anchor: {link.anchor_text || "auto"}</p>
                      </div>
                      {!link.is_implemented ? (
                        <Button variant="outline" size="sm" onClick={async () => { await seoStudioService.implementInternalLink(link.id); setInternalLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, is_implemented: true } : l)); }}>
                          Implement
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Done</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No link suggestions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Recommendations & Issues</CardTitle></CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-3 rounded-lg border flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === "critical" ? "destructive" : rec.priority === "high" ? "default" : "secondary"} className="text-[10px]">
                            {rec.priority}
                          </Badge>
                          <span className="font-medium text-sm">{rec.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {rec.impact && <span>Impact: {rec.impact}</span>}
                          {rec.effort && <span>Effort: {rec.effort}</span>}
                        </div>
                      </div>
                      {rec.status === "open" ? (
                        <Button variant="outline" size="sm" onClick={async () => { await seoStudioService.resolveRecommendation(rec.id); setRecommendations((prev) => prev.map((r) => r.id === rec.id ? { ...r, status: "resolved" } : r)); }}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recommendations yet. Run an audit first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Competitor Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Input placeholder="Competitor name" value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} className="w-[200px]" />
                <Input placeholder="Competitor URL" value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} className="flex-1" />
                <Button onClick={handleAddCompetitor} disabled={!competitorUrl || !competitorName}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              {competitors.length > 0 && (
                <div className="space-y-3">
                  {competitors.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{c.competitor_name}</p>
                          <p className="text-xs text-muted-foreground">{c.competitor_url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAnalyzeCompetitor(c.competitor_url)} disabled={competitorAnalyzing}>
                            {competitorAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={async () => { await seoStudioService.deleteCompetitor(c.id); setCompetitors((prev) => prev.filter((x) => x.id !== c.id)); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {competitorAnalysis && (
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <h4 className="font-semibold">Analysis Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Strengths</p>
                      {Array.isArray(competitorAnalysis?.strengths) && competitorAnalysis.strengths.map((s: string, i: number) => <p key={i} className="text-sm">• {s}</p>)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Weaknesses</p>
                      {Array.isArray(competitorAnalysis?.weaknesses) && competitorAnalysis.weaknesses.map((w: string, i: number) => <p key={i} className="text-sm">• {w}</p>)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Keyword Opportunities</p>
                      {Array.isArray(competitorAnalysis?.keyword_opportunities) && competitorAnalysis.keyword_opportunities.map((k: string, i: number) => <p key={i} className="text-sm">• {k}</p>)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-600 mb-1">Content Gaps</p>
                      {Array.isArray(competitorAnalysis?.content_gaps) && competitorAnalysis.content_gaps.map((g: string, i: number) => <p key={i} className="text-sm">• {g}</p>)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> SEO Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateReport} disabled={reportLoading}>
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
              {reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {r.score}/100 · {r.issues_count} issues · {r.recommendations_count} recommendations
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No reports yet. Generate your first report.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> SEO History</CardTitle></CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {history.map((h) => (
                      <div key={h.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{h.event_type}</Badge>
                            {h.score !== null && <Badge>Score: {h.score}</Badge>}
                            <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No history yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
