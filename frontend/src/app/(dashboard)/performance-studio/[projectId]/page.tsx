"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Image,
  FileCode,
  History,
  BarChart3,
  Plus,
  CheckCircle,
  XCircle,
  TrendingUp,
  Timer,
  Download,
} from "lucide-react";
import {
  performanceStudioService,
  type PerformanceAudit,
  type CoreWebVitals,
  type PerformanceRecommendation,
  type ImageAuditItem,
  type AssetAuditItem,
  type PerformanceDashboard,
  type PerformanceReport,
  type OptimizationHistoryItem,
} from "@/services/performance-studio";

function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const color = score >= 90 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const dim = size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${dim}`}>
        <svg className={dim} viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score}, 100`} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${text}`}>{score}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function VitalCard({ label, value, unit, status, description }: { label: string; value: number; unit: string; status: string; description: string }) {
  const color = status === "good" ? "text-green-600" : status === "needs-improvement" ? "text-yellow-600" : "text-red-600";
  const bg = status === "good" ? "bg-green-50" : status === "needs-improvement" ? "bg-yellow-50" : "bg-red-50";
  return (
    <div className={`p-4 rounded-lg ${bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={status === "good" ? "default" : status === "needs-improvement" ? "secondary" : "destructive"} className="text-[10px]">
          {status === "good" ? "Good" : status === "needs-improvement" ? "Needs Work" : "Poor"}
        </Badge>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {value}{unit}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export default function PerformanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const auditIdParam = searchParams.get("audit");

  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null);
  const [audits, setAudits] = useState<PerformanceAudit[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<PerformanceAudit | null>(null);
  const [vitals, setVitals] = useState<CoreWebVitals | null>(null);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [images, setImages] = useState<ImageAuditItem[]>([]);
  const [assets, setAssets] = useState<AssetAuditItem[]>([]);
  const [history, setHistory] = useState<OptimizationHistoryItem[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [auditUrl, setAuditUrl] = useState("");
  const [auditing, setAuditing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dash, auditList] = await Promise.all([
        performanceStudioService.getDashboard(projectId),
        performanceStudioService.listAudits(projectId),
      ]);
      setDashboard(dash ?? null);
      setAudits(auditList ?? []);

      const targetAuditId = auditIdParam || (auditList ?? [])[0]?.id;
      if (targetAuditId) {
        const audit = (auditList ?? []).find((a) => a.id === targetAuditId) || await performanceStudioService.getAudit(targetAuditId);
        setSelectedAudit(audit ?? null);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, auditIdParam]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadTabData = useCallback(async (tab: string) => {
    if (!selectedAudit) return;
    try {
      switch (tab) {
        case "vitals":
          const v = await performanceStudioService.getVitals(selectedAudit.id);
          setVitals(v ?? null);
          break;
        case "recommendations":
          const r = await performanceStudioService.getRecommendations(selectedAudit.id);
          setRecommendations(r ?? []);
          break;
        case "images":
          const img = await performanceStudioService.getImages(selectedAudit.id);
          setImages(img ?? []);
          break;
        case "assets":
          const ast = await performanceStudioService.getAssets(selectedAudit.id);
          setAssets(ast ?? []);
          break;
        case "history":
          const h = await performanceStudioService.listHistory(projectId);
          setHistory(h ?? []);
          break;
        case "reports":
          const rp = await performanceStudioService.listReports(projectId);
          setReports(rp ?? []);
          break;
      }
    } catch (err) {
      console.error("Failed to load tab data:", err);
    }
  }, [selectedAudit, projectId]);

  const handleRunAudit = async () => {
    if (!auditUrl) return;
    setAuditing(true);
    try {
      const url = auditUrl.startsWith("http") ? auditUrl : `https://${auditUrl}`;
      const result = await performanceStudioService.runAudit(projectId, url);
      setAudits((prev) => [result, ...prev]);
      setSelectedAudit(result);
      setAuditUrl("");
      await loadData();
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setAuditing(false);
    }
  };

  const handleCreateReport = async () => {
    if (!selectedAudit) return;
    try {
      const result = await performanceStudioService.createReport(projectId, `Performance Report - ${new Date().toLocaleDateString()}`);
      setReports((prev) => [result, ...prev]);
    } catch (err) {
      console.error("Report creation failed:", err);
    }
  };

  const generateReport = () => {
    if (!selectedAudit || !dashboard) return;

    const scoreColor = (s: number) => s >= 90 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";
    const scoreBg = (s: number) => s >= 90 ? "#dcfce7" : s >= 50 ? "#fef3c7" : "#fecaca";
    const vitalStatus = (s: string) => s === "good" ? '<span style="color:#16a34a;font-weight:600">Good</span>' : s === "needs-improvement" ? '<span style="color:#d97706;font-weight:600">Needs Improvement</span>' : '<span style="color:#dc2626;font-weight:600">Poor</span>';

    const now = new Date().toLocaleString();
    const url = selectedAudit.url;

    const imgRows = images.length > 0 ? images.map(img => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${img.url}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${img.format}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${(img.original_size / 1024).toFixed(1)} KB</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${img.optimized_size ? (img.optimized_size / 1024).toFixed(1) + " KB" : "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${img.has_lazy_loading ? "✓" : "✗"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${img.has_alt_text ? "✓" : "✗"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#2563eb">${img.recommended_format || "-"}</td>
      </tr>`).join("") : '<tr><td colspan="7" style="padding:16px;text-align:center;color:#6b7280">No image data available</td></tr>';

    const assetRows = assets.length > 0 ? assets.sort((a, b) => b.size - a.size).map(a => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.url}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.asset_type}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${(a.size / 1024).toFixed(1)} KB</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${a.gzipped_size ? (a.gzipped_size / 1024).toFixed(1) + " KB" : "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${a.is_minified ? "✓" : "✗"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${a.is_render_blocking ? "⚠ Yes" : "No"}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${a.is_unused ? "⚠ Yes" : "No"}</td>
      </tr>`).join("") : '<tr><td colspan="7" style="padding:16px;text-align:center;color:#6b7280">No asset data available</td></tr>';

    const recRows = recommendations.length > 0 ? recommendations.map(r => `
      <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;${r.priority === "critical" ? "border-left:4px solid #dc2626;" : r.priority === "high" ? "border-left:4px solid #f59e0b;" : "border-left:4px solid #3b82f6;"}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;${r.priority === "critical" ? "background:#fecaca;color:#991b1b;" : r.priority === "high" ? "background:#fef3c7;color:#92400e;" : "background:#dbeafe;color:#1e40af;"}">${r.priority.toUpperCase()}</span>
          <span style="font-size:12px;color:#6b7280">${r.category}</span>
        </div>
        <div style="font-weight:600;margin-bottom:4px">${r.title}</div>
        ${r.problem ? `<div style="font-size:13px;color:#4b5563;margin-bottom:4px">${r.problem}</div>` : ""}
        ${r.impact ? `<div style="font-size:12px;color:#6b7280">Impact: ${r.impact}</div>` : ""}
        ${r.estimated_improvement ? `<div style="font-size:12px;color:#6b7280">Est. Improvement: ${r.estimated_improvement}</div>` : ""}
        ${r.implementation_guide ? `<div style="margin-top:8px;padding:8px;background:#f9fafb;border-radius:6px;font-size:12px;color:#374151"><strong>How to fix:</strong> ${r.implementation_guide}</div>` : ""}
      </div>`).join("") : '<div style="padding:16px;text-align:center;color:#6b7280">No recommendations available</div>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Performance Report - ${url}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none !important; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; background: #fff; line-height: 1.6; }
  .container { max-width: 900px; margin: 0 auto; padding: 40px 32px; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; }
  .header h1 { font-size: 28px; margin-bottom: 8px; }
  .header p { color: #6b7280; font-size: 14px; }
  h2 { font-size: 20px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
  .score-card { text-align: center; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; }
  .score-card .number { font-size: 36px; font-weight: 700; }
  .score-card .label { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .vital-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .vital-card { padding: 12px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
  .vital-card .label { font-size: 12px; color: #6b7280; }
  .vital-card .value { font-size: 20px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta { font-size: 12px; color: #9ca3af; margin-top: 40px; text-align: center; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Performance Audit Report</h1>
    <p><strong>${url}</strong></p>
    <p>Generated: ${now}</p>
  </div>

  <h2>Overall Scores</h2>
  <div class="score-grid">
    <div class="score-card" style="background:${scoreBg(dashboard.overall_score)}">
      <div class="number" style="color:${scoreColor(dashboard.overall_score)}">${dashboard.overall_score}</div>
      <div class="label">Overall</div>
    </div>
    <div class="score-card" style="background:${scoreBg(dashboard.performance_score)}">
      <div class="number" style="color:${scoreColor(dashboard.performance_score)}">${dashboard.performance_score}</div>
      <div class="label">Performance</div>
    </div>
    <div class="score-card" style="background:${scoreBg(dashboard.accessibility_score)}">
      <div class="number" style="color:${scoreColor(dashboard.accessibility_score)}">${dashboard.accessibility_score}</div>
      <div class="label">Accessibility</div>
    </div>
    <div class="score-card" style="background:${scoreBg(dashboard.best_practices_score)}">
      <div class="number" style="color:${scoreColor(dashboard.best_practices_score)}">${dashboard.best_practices_score}</div>
      <div class="label">Best Practices</div>
    </div>
  </div>

  <h2>Core Web Vitals</h2>
  ${vitals ? `
  <div class="vital-grid">
    <div class="vital-card"><div class="label">LCP (Largest Contentful Paint)</div><div class="value">${vitals.lcp}s</div><div>${vitalStatus(vitals.lcp_status)}</div></div>
    <div class="vital-card"><div class="label">INP (Interaction to Next Paint)</div><div class="value">${vitals.inp}ms</div><div>${vitalStatus(vitals.inp_status)}</div></div>
    <div class="vital-card"><div class="label">CLS (Cumulative Layout Shift)</div><div class="value">${vitals.cls}</div><div>${vitalStatus(vitals.cls_status)}</div></div>
    <div class="vital-card"><div class="label">FCP (First Contentful Paint)</div><div class="value">${vitals.fcp}s</div><div>${vitalStatus(vitals.fcp_status)}</div></div>
    <div class="vital-card"><div class="label">TTFB (Time to First Byte)</div><div class="value">${vitals.ttfb}ms</div><div>${vitalStatus(vitals.ttfb_status)}</div></div>
    <div class="vital-card"><div class="label">Speed Index</div><div class="value">${vitals.speed_index}s</div><div>${vitalStatus(vitals.speed_index_status)}</div></div>
  </div>` : '<p style="color:#6b7280">No Core Web Vitals data available for this audit.</p>'}

  <h2>Resource Summary</h2>
  ${selectedAudit.metrics ? `
  <table>
    <tr><th>Metric</th><th style="text-align:right">Value</th></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Total Page Size</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).total_bytes / 1024 / 1024).toFixed(2)} MB</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Total Requests</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${(selectedAudit.metrics as Record<string, number>).total_requests}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">DOM Size</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${(selectedAudit.metrics as Record<string, number>).dom_size} elements</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">JavaScript</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).js_size / 1024).toFixed(1)} KB (${(selectedAudit.metrics as Record<string, number>).js_requests} files)</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">CSS</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).css_size / 1024).toFixed(1)} KB (${(selectedAudit.metrics as Record<string, number>).css_requests} files)</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Images</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).image_size / 1024).toFixed(1)} KB (${(selectedAudit.metrics as Record<string, number>).image_requests} files)</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Fonts</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).font_size / 1024).toFixed(1)} KB (${(selectedAudit.metrics as Record<string, number>).font_requests} files)</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">HTML</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).html_size / 1024).toFixed(1)} KB</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">Third-Party Size</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${((selectedAudit.metrics as Record<string, number>).third_party_size / 1024).toFixed(1)} KB</td></tr>
  </table>` : '<p style="color:#6b7280">No metrics data available.</p>'}

  <h2>Recommendations (${recommendations.length})</h2>
  ${recRows}

  <h2>Image Audit (${images.length} images)</h2>
  <table>
    <tr><th>URL</th><th>Format</th><th style="text-align:right">Original</th><th style="text-align:right">Optimized</th><th style="text-align:center">Lazy</th><th style="text-align:center">Alt Text</th><th>Recommend</th></tr>
    ${imgRows}
  </table>

  <h2>Asset Audit (${assets.length} assets)</h2>
  <table>
    <tr><th>URL</th><th>Type</th><th style="text-align:right">Size</th><th style="text-align:right">Gzipped</th><th style="text-align:center">Minified</th><th style="text-align:center">Render Block</th><th style="text-align:center">Unused</th></tr>
    ${assetRows}
  </table>

  <div class="meta">
    <p>Performance Audit Report &mdash; Generated by BuilderWeb Performance Studio</p>
    <p>${now}</p>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const reportUrl = URL.createObjectURL(blob);
    window.open(reportUrl, "_blank");
    URL.revokeObjectURL(reportUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/performance-studio")} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Performance Studio</h1>
            <p className="text-sm text-muted-foreground">{selectedAudit?.url || "Run an audit to get started"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter URL to audit"
            value={auditUrl}
            onChange={(e) => setAuditUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRunAudit(); }}
            className="w-[250px]"
          />
          <Button onClick={handleRunAudit} disabled={auditing || !auditUrl}>
            {auditing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Audit
          </Button>
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <ScoreRing score={dashboard.overall_score} label="Overall" size="sm" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ScoreRing score={dashboard.performance_score} label="Performance" size="sm" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ScoreRing score={dashboard.accessibility_score} label="Accessibility" size="sm" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ScoreRing score={dashboard.best_practices_score} label="Best Practices" size="sm" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); loadTabData(v); }}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Timer className="h-4 w-4" /> Core Web Vitals</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg LCP</span>
                      <span className={`font-semibold ${dashboard.avg_lcp <= 2.5 ? "text-green-600" : dashboard.avg_lcp <= 4 ? "text-yellow-600" : "text-red-600"}`}>
                        {dashboard.avg_lcp}s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg CLS</span>
                      <span className={`font-semibold ${dashboard.avg_cls <= 0.1 ? "text-green-600" : dashboard.avg_cls <= 0.25 ? "text-yellow-600" : "text-red-600"}`}>
                        {dashboard.avg_cls}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg INP</span>
                      <span className={`font-semibold ${dashboard.avg_inp <= 200 ? "text-green-600" : dashboard.avg_inp <= 500 ? "text-yellow-600" : "text-red-600"}`}>
                        {dashboard.avg_inp}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Statistics</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Audits</span><span className="font-semibold">{dashboard.total_audits}</span></div>
                    <div className="flex justify-between"><span>Total Issues</span><span className="font-semibold text-yellow-600">{dashboard.total_issues}</span></div>
                    <div className="flex justify-between"><span>Recommendations</span><span className="font-semibold">{dashboard.total_recommendations}</span></div>
                    <div className="flex justify-between"><span>Resolved</span><span className="font-semibold text-green-600">{dashboard.resolved_recommendations}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Trend</CardTitle></CardHeader>
                <CardContent>
                  {(dashboard.trend ?? []).length > 0 ? (
                    <div className="space-y-1">
                      {(dashboard.trend ?? []).slice(-5).map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t.date}</span>
                          <Badge variant={t.score >= 90 ? "default" : t.score >= 50 ? "secondary" : "destructive"}>
                            {t.score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trend data yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          {vitals ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <VitalCard label="LCP" value={vitals.lcp} unit="s" status={vitals.lcp_status} description="Largest Contentful Paint — how long until the main content loads" />
                <VitalCard label="INP" value={vitals.inp} unit="ms" status={vitals.inp_status} description="Interaction to Next Paint — responsiveness to user input" />
                <VitalCard label="CLS" value={vitals.cls} unit="" status={vitals.cls_status} description="Cumulative Layout Shift — visual stability of the page" />
                <VitalCard label="FCP" value={vitals.fcp} unit="s" status={vitals.fcp_status} description="First Contentful Paint — when first content appears" />
                <VitalCard label="TTFB" value={vitals.ttfb} unit="ms" status={vitals.ttfb_status} description="Time to First Byte — server response time" />
                <VitalCard label="Speed Index" value={vitals.speed_index} unit="s" status={vitals.speed_index_status} description="How quickly content is visually displayed" />
                <VitalCard label="TBT" value={vitals.tbt} unit="ms" status={vitals.tbt_status} description="Total Blocking Time — main thread blocking duration" />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">What are Core Web Vitals?</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Core Web Vitals are a set of real-world, user-centered metrics that measure key aspects of user experience. Google uses these metrics as ranking factors in search results.</p>
                  <p><strong>LCP</strong> should be under 2.5 seconds. <strong>INP</strong> should be under 200ms. <strong>CLS</strong> should be under 0.1.</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Gauge className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Select an audit to view Core Web Vitals.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === "critical" ? "destructive" : rec.priority === "high" ? "default" : "secondary"} className="text-[10px]">
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{rec.category}</Badge>
                          <span className="font-semibold text-sm">{rec.title}</span>
                        </div>
                        {rec.problem && <p className="text-sm text-muted-foreground">{rec.problem}</p>}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {rec.impact && <span>Impact: {rec.impact}</span>}
                          {rec.estimated_improvement && <span>Est: {rec.estimated_improvement}</span>}
                        </div>
                        {rec.implementation_guide && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium text-xs mb-1">Implementation Guide</p>
                            <p className="text-muted-foreground">{rec.implementation_guide}</p>
                          </div>
                        )}
                      </div>
                      {rec.status === "open" ? (
                        <Button variant="outline" size="sm" onClick={async () => {
                          await performanceStudioService.resolveRecommendation(rec.id);
                          setRecommendations((prev) => prev.map((r) => r.id === rec.id ? { ...r, status: "resolved" } : r));
                        }}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Run an audit to get recommendations.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          {images.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{images.length}</p>
                    <p className="text-xs text-muted-foreground">Total Images</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {images.filter((i) => i.optimized_size && i.optimized_size < i.original_size).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Optimizable</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {(images.reduce((acc, i) => acc + i.savings_bytes, 0) / 1024).toFixed(0)}KB
                    </p>
                    <p className="text-xs text-muted-foreground">Potential Savings</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Image Analysis</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {images.map((img) => (
                      <div key={img.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{img.url}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{img.format}</span>
                            <span>{(img.original_size / 1024).toFixed(1)}KB</span>
                            {img.optimized_size && <span>→ {(img.optimized_size / 1024).toFixed(1)}KB</span>}
                            {img.recommended_format && <span className="text-blue-600">Use {img.recommended_format}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {img.has_lazy_loading ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {img.has_alt_text ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <Image className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Run an audit to analyze images.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          {assets.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["javascript", "css", "html", "font"] as const).map((type) => {
                  const typeAssets = assets.filter((a) => a.asset_type === type);
                  const totalSize = typeAssets.reduce((acc, a) => acc + a.size, 0);
                  return (
                    <Card key={type}>
                      <CardContent className="p-4 text-center">
                        <p className="text-lg font-bold">{typeAssets.length}</p>
                        <p className="text-xs text-muted-foreground capitalize">{type}</p>
                        <p className="text-xs text-muted-foreground">{(totalSize / 1024).toFixed(1)}KB</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-sm">Asset Details</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {assets.sort((a, b) => b.size - a.size).map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{asset.url}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{asset.asset_type}</span>
                            <span>{(asset.size / 1024).toFixed(1)}KB</span>
                            {asset.gzipped_size && <span>Gzipped: {(asset.gzipped_size / 1024).toFixed(1)}KB</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {asset.is_minified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {asset.is_render_blocking && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {asset.is_unused && <XCircle className="h-4 w-4 text-orange-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <FileCode className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Run an audit to analyze assets.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          {audits.length > 0 ? (
            <div className="space-y-3">
              {audits.map((audit) => (
                <Card key={audit.id} className={`cursor-pointer hover:shadow-sm transition-shadow ${selectedAudit?.id === audit.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedAudit(audit)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <ScoreRing score={audit.overall_score} label="" size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{audit.url}</p>
                      <p className="text-xs text-muted-foreground">{new Date(audit.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span>Perf: {audit.performance_score}</span>
                      <span>A11y: {audit.accessibility_score}</span>
                      <span>SEO: {audit.seo_score}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12 text-center">
              <CardContent>
                <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No audits yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Optimization History</CardTitle></CardHeader>
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
                            {h.score_after !== null && <Badge>Score: {h.score_after}</Badge>}
                            <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Reports</CardTitle>
                <div className="flex gap-2">
                  {selectedAudit && <Button size="sm" variant="outline" onClick={generateReport}><Download className="h-4 w-4 mr-1" /> Download Report</Button>}
                  <Button size="sm" onClick={handleCreateReport}>
                    <Plus className="h-4 w-4 mr-1" /> Generate Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">Score: {r.score}/100 · {new Date(r.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reports yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
