"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { landingPagesService } from "@/services/landing-pages";
import type { LandingPage, LandingPageOutput } from "@/types";

type Device = "desktop" | "tablet" | "mobile";

export default function LandingPagePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const lpId = params.landingPageId as string;

  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [content, setContent] = useState<LandingPageOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    const load = async () => {
      try {
        const lp = await landingPagesService.getById(lpId);
        setLandingPage(lp);
        setContent(lp.aiResponse || null);
      } catch (err) {
        console.error("Failed to load:", err);
        setError(err instanceof Error ? err.message : "Failed to load landing page. It may have been deleted or the server restarted.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lpId]);

  const handleExportHTML = () => {
    if (!content) return;
    const html = generateHTML(content);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.title || "landing-page"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content || error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "No content to preview."}</p>
        <div className="flex gap-3">
          <Link href="/landing-pages">
            <Button variant="outline">Back to Landing Pages</Button>
          </Link>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const deviceWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href={`/landing-pages/${lpId}/editor`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-sm font-semibold">{landingPage?.name || "Preview"}</h2>
            <p className="text-xs text-muted-foreground">
              Version {landingPage?.currentVersion || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md" role="group" aria-label="Preview device selector">
            {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
              <Button
                key={d}
                variant={device === d ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-none"
                onClick={() => setDevice(d)}
                aria-label={`${d} view`}
                aria-pressed={device === d}
              >
                {d === "desktop" && <Monitor className="h-4 w-4" />}
                {d === "tablet" && <Tablet className="h-4 w-4" />}
                {d === "mobile" && <Smartphone className="h-4 w-4" />}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExportHTML} aria-label="Export as HTML">
            <Download className="mr-1 h-3 w-3" />
            Export HTML
          </Button>

          <Link href={`/landing-pages/${lpId}/editor`}>
            <Button size="sm">
              <Eye className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 p-6 flex justify-center">
        <div
          className="bg-white shadow-lg rounded-lg transition-all duration-300"
          style={{ maxWidth: deviceWidths[device], width: "100%" }}
        >
          <FullPreview content={content} />
        </div>
      </div>
    </div>
  );
}

function FullPreview({ content }: { content: LandingPageOutput }) {
  const c = content;
  const colors = c.colors || { primary: "#6366f1", secondary: "#4f46e5", accent: "#8b5cf6" };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* ── HERO ────────────────────────────────────────────── */}
      {c.hero && (
        <section className="relative overflow-hidden py-24 px-8" style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
          <div className="relative max-w-5xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg">
              {c.hero.headline}
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90 leading-relaxed font-light">
              {c.hero.subheadline}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="px-10 py-4 rounded-full bg-white text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-200" style={{ color: colors.primary }}>
                {c.hero.primaryCta}
              </button>
              {c.hero.secondaryCta && (
                <button className="px-10 py-4 rounded-full border-2 border-white/40 text-white text-lg font-semibold hover:bg-white/10 transition-all duration-200 backdrop-blur-sm">
                  {c.hero.secondaryCta}
                </button>
              )}
            </div>
            {c.hero.trustBadges && c.hero.trustBadges.length > 0 && (
              <div className="flex gap-6 justify-center mt-10 flex-wrap">
                {c.hero.trustBadges.map((badge, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm text-white/80 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {badge}
                  </span>
                ))}
              </div>
            )}
            {c.hero.socialProof && (
              <div className="mt-14 pt-8 border-t border-white/20">
                <p className="text-sm text-white/60 mb-5 uppercase tracking-widest font-medium">{c.hero.socialProof.label}</p>
                <div className="flex gap-10 justify-center items-center flex-wrap opacity-70">
                  {c.hero.socialProof.logos.map((logo, i) => (
                    <span key={i} className="text-xl font-bold text-white/80 tracking-wide">{logo}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SOCIAL PROOF LOGOS ──────────────────────────────── */}
      {c.socialProof && (
        <section className="py-16 px-8 bg-gray-50 border-y border-gray-100">
          <div className="max-w-5xl mx-auto text-center">
            {c.socialProof.headline && (
              <p className="text-sm uppercase tracking-widest text-gray-400 mb-8 font-medium">{c.socialProof.headline}</p>
            )}
            <div className="flex gap-12 justify-center items-center flex-wrap mb-10">
              {c.socialProof.logos.map((logo, i) => (
                <span key={i} className="text-2xl font-bold text-gray-300 hover:text-gray-400 transition-colors">{logo}</span>
              ))}
            </div>
            {c.socialProof.metrics && c.socialProof.metrics.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {c.socialProof.metrics.map((m, i) => (
                  <div key={i}>
                    <div className="text-3xl font-extrabold" style={{ color: colors.primary }}>{m.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PROBLEM ─────────────────────────────────────────── */}
      {c.problem && (
        <section className="py-20 px-8">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">{c.problem.headline}</h2>
            {c.problem.description && (
              <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">{c.problem.description}</p>
            )}
            {c.problem.points && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {c.problem.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-red-50 border border-red-100 text-left">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-lg">!</div>
                    <p className="text-gray-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SOLUTION ────────────────────────────────────────── */}
      {c.solution && (
        <section className="py-20 px-8" style={{ background: `linear-gradient(180deg, ${colors.primary}06, ${colors.accent}04)` }}>
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">{c.solution.headline}</h2>
            {c.solution.description && (
              <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">{c.solution.description}</p>
            )}
            {c.solution.highlights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {c.solution.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: colors.primary }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── BENEFITS ────────────────────────────────────────── */}
      {c.benefits && c.benefits.length > 0 && (
        <section className="py-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-gray-900">Why You&apos;ll Love It</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {c.benefits.map((b, i) => (
                <div key={i} className="group p-8 rounded-3xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 text-center bg-white" style={{ '--hover-shadow': `${colors.primary}20` } as React.CSSProperties}>
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
                    {b.icon ? "✦" : (i + 1)}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{b.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ────────────────────────────────────────── */}
      {c.features && c.features.length > 0 && (
        <section className="py-20 px-8" style={{ background: `linear-gradient(180deg, ${colors.primary}04, ${colors.accent}06)` }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-gray-900">Powerful Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {c.features.map((f, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center" style={{ background: `${colors.primary}10` }}>
                    <div className="w-6 h-6 rounded" style={{ background: colors.primary }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      {c.howItWorks && c.howItWorks.steps && c.howItWorks.steps.length > 0 && (
        <section className="py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-gray-900">{c.howItWorks.headline}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {c.howItWorks.steps.map((step, i) => (
                <div key={i} className="text-center relative">
                  {i < c.howItWorks.steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gray-200" />
                  )}
                  <div className="relative z-10 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STATISTICS ──────────────────────────────────────── */}
      {c.statistics && c.statistics.length > 0 && (
        <section className="py-20 px-8" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center text-white">
              {c.statistics.map((s, i) => (
                <div key={i}>
                  <div className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-sm">{s.value}</div>
                  <div className="text-sm uppercase tracking-widest opacity-70 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      {c.testimonials && c.testimonials.length > 0 && (
        <section className="py-20 px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-gray-900">What Our Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {c.testimonials.map((t, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                  {t.rating && (
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 italic mb-6 leading-relaxed text-lg">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: colors.primary }}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-400">
                        {t.role}{t.company ? ` at ${t.company}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ─────────────────────────────────────────── */}
      {c.pricing && c.pricing.length > 0 && (
        <section className="py-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-6 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-center text-gray-400 mb-16 text-lg">Choose the plan that fits your needs. Upgrade anytime.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {c.pricing.map((p, i) => (
                <div
                  key={i}
                  className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                    p.highlighted
                      ? "border-transparent shadow-2xl scale-105 z-10 bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  style={
                    p.highlighted
                      ? { borderColor: colors.primary, boxShadow: `0 25px 50px -12px ${colors.primary}25` }
                      : {}
                  }
                >
                  {p.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider" style={{ background: colors.primary }}>
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{p.name}</h3>
                  {p.description && <p className="text-gray-400 text-sm mb-6">{p.description}</p>}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-extrabold" style={{ color: colors.primary }}>{p.price}</span>
                    {p.period && <span className="text-gray-400">{p.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200"
                    style={
                      p.highlighted
                        ? { background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: "white", boxShadow: `0 4px 14px ${colors.primary}40` }
                        : { border: `2px solid ${colors.primary}`, color: colors.primary, background: "transparent" }
                    }
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GUARANTEE ───────────────────────────────────────── */}
      {c.guarantee && (
        <section className="py-16 px-8" style={{ background: `${colors.primary}06` }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${colors.primary}10` }}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-2xl font-extrabold mb-3 text-gray-900">{c.guarantee.headline}</h3>
            <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">{c.guarantee.description}</p>
          </div>
        </section>
      )}

      {/* ── FAQ ─────────────────────────────────────────────── */}
      {c.faq && c.faq.length > 0 && (
        <section className="py-20 px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {c.faq.map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.question}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      {c.finalCta && (
        <section
          className="py-24 px-8 text-center text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-sm">{c.finalCta.headline}</h2>
            <p className="text-xl opacity-90 mb-10 leading-relaxed">
              {c.finalCta.subheadline}
            </p>
            <button className="px-12 py-4 rounded-full bg-white text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-200" style={{ color: colors.primary }}>
              {c.finalCta.cta}
            </button>
          </div>
        </section>
      )}

      {/* ── CONTACT ─────────────────────────────────────────── */}
      {c.contact && (
        <section className="py-20 px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">{c.contact.headline}</h2>
            <p className="text-gray-500 mb-10 text-lg leading-relaxed">{c.contact.description}</p>
            <div className="flex gap-4 justify-center flex-wrap">
              {c.contact.email && (
                <span className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {c.contact.email}
                </span>
              )}
              {c.contact.phone && (
                <span className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {c.contact.phone}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      {c.footer && (
        <footer className="py-10 px-8 bg-gray-900 text-center">
          <p className="text-gray-400 mb-2 text-sm">{c.footer.description}</p>
          <p className="text-gray-600 text-xs">{c.footer.copyright}</p>
        </footer>
      )}
    </div>
  );
}

function generateHTML(content: LandingPageOutput): string {
  const c = content;
  const colors = c.colors || { primary: "#6366f1", secondary: "#4f46e5", accent: "#8b5cf6" };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(c.seo?.title || c.title || "Landing Page")}</title>
  <meta name="description" content="${escapeHtml(c.seo?.description || "")}">
  <meta name="keywords" content="${escapeHtml(c.seo?.keywords?.join(", ") || "")}">
  <meta property="og:title" content="${escapeHtml(c.seo?.ogTitle || c.seo?.title || "")}">
  <meta property="og:description" content="${escapeHtml(c.seo?.ogDescription || c.seo?.description || "")}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(c.twitterCard?.title || "")}">
  <meta name="twitter:description" content="${escapeHtml(c.twitterCard?.description || "")}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    .hero { position: relative; padding: 100px 32px; text-align: center; background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}); color: white; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 60px 60px; }
    .hero h1 { position: relative; font-size: 3.5rem; font-weight: 900; margin-bottom: 24px; line-height: 1.1; letter-spacing: -0.02em; }
    .hero p { position: relative; font-size: 1.25rem; opacity: 0.9; max-width: 640px; margin: 0 auto 40px; line-height: 1.7; }
    .btn-primary { display: inline-block; padding: 16px 40px; border-radius: 999px; background: white; color: ${colors.primary}; font-size: 1.1rem; font-weight: 700; border: none; cursor: pointer; text-decoration: none; box-shadow: 0 4px 14px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
    .btn-secondary { display: inline-block; padding: 16px 40px; border-radius: 999px; border: 2px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.1); color: white; font-size: 1.1rem; font-weight: 600; cursor: pointer; text-decoration: none; backdrop-filter: blur(10px); }
    .trust-badges { display: flex; gap: 24px; justify-content: center; margin-top: 40px; flex-wrap: wrap; }
    .trust-badge { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 999px; }
    .social-proof { padding: 64px 32px; background: #f9fafb; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .social-proof .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af; margin-bottom: 32px; font-weight: 500; }
    .social-proof .logos { display: flex; gap: 48px; justify-content: center; flex-wrap: wrap; align-items: center; }
    .social-proof .logo { font-size: 1.5rem; font-weight: 700; color: #d1d5db; }
    .social-proof .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 48px; max-width: 800px; margin-left: auto; margin-right: auto; }
    .social-proof .metric-val { font-size: 2rem; font-weight: 900; color: ${colors.primary}; }
    .social-proof .metric-lbl { font-size: 0.875rem; color: #9ca3af; margin-top: 4px; }
    .section { padding: 80px 32px; }
    .section-alt { padding: 80px 32px; background: #f9fafb; }
    .section-accent { padding: 80px 32px; background: ${colors.primary}06; }
    .container { max-width: 960px; margin: 0 auto; }
    .container-wide { max-width: 1100px; margin: 0 auto; }
    .section-title { font-size: 2.5rem; font-weight: 900; text-align: center; margin-bottom: 20px; letter-spacing: -0.02em; }
    .section-subtitle { font-size: 1.125rem; color: #9ca3af; text-align: center; margin-bottom: 56px; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
    .card { padding: 32px; border-radius: 24px; background: white; border: 1px solid #f3f4f6; transition: box-shadow 0.3s; }
    .card:hover { box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1); }
    .card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
    .card p { color: #6b7280; line-height: 1.7; }
    .problem-card { display: flex; align-items: flex-start; gap: 16px; padding: 24px; border-radius: 16px; background: #fef2f2; border: 1px solid #fecaca; }
    .problem-card .icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .solution-card { display: flex; align-items: flex-start; gap: 16px; padding: 24px; border-radius: 16px; background: white; border: 1px solid #f3f4f6; }
    .solution-card .icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background: ${colors.primary}; color: white; display: flex; align-items: center; justify-content: center; }
    .step-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 900; margin: 0 auto 24px; box-shadow: 0 8px 20px ${colors.primary}30; }
    .stat-value { font-size: 3rem; font-weight: 900; color: white; }
    .stat-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.7); margin-top: 8px; }
    .testimonial-card { padding: 32px; border-radius: 24px; background: white; border: 1px solid #f3f4f6; }
    .testimonial-card .quote { color: #4b5563; font-style: italic; margin-bottom: 24px; line-height: 1.7; font-size: 1.05rem; }
    .testimonial-card .author { display: flex; align-items: center; gap: 12px; }
    .testimonial-card .avatar { width: 40px; height: 40px; border-radius: 50%; background: ${colors.primary}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; }
    .testimonial-card .name { font-weight: 700; }
    .testimonial-card .role { font-size: 0.875rem; color: #9ca3af; }
    .pricing-card { padding: 40px; border-radius: 24px; border: 2px solid #e5e7eb; text-align: center; transition: transform 0.3s; background: white; }
    .pricing-card:hover { transform: translateY(-4px); }
    .pricing-card.highlighted { border-color: ${colors.primary}; transform: scale(1.05); box-shadow: 0 25px 50px -12px ${colors.primary}25; position: relative; }
    .pricing-badge { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); padding: 6px 16px; border-radius: 999px; background: ${colors.primary}; color: white; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .pricing-card .price { font-size: 3.5rem; font-weight: 900; color: ${colors.primary}; margin: 16px 0; }
    .pricing-card .period { color: #9ca3af; font-size: 0.875rem; }
    .pricing-card ul { list-style: none; padding: 0; margin: 32px 0; text-align: left; }
    .pricing-card li { padding: 8px 0; font-size: 0.9rem; color: #4b5563; display: flex; align-items: center; gap: 12px; }
    .pricing-card li::before { content: '✓'; color: ${colors.primary}; font-weight: 700; }
    .btn-pricing { display: block; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; border: 2px solid ${colors.primary}; background: transparent; color: ${colors.primary}; transition: all 0.2s; }
    .btn-pricing.filled { background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); color: white; border-color: transparent; box-shadow: 0 4px 14px ${colors.primary}40; }
    .guarantee { padding: 64px 32px; text-align: center; background: ${colors.primary}06; }
    .guarantee .shield { width: 80px; height: 80px; border-radius: 50%; background: ${colors.primary}10; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .faq-card { padding: 24px; border-radius: 16px; background: white; border: 1px solid #f3f4f6; margin-bottom: 16px; }
    .faq-card h3 { font-weight: 700; margin-bottom: 8px; }
    .faq-card p { color: #6b7280; line-height: 1.7; }
    .cta-section { padding: 100px 32px; text-align: center; color: white; background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}); position: relative; overflow: hidden; }
    .cta-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px; }
    .cta-section h2 { position: relative; font-size: 2.5rem; font-weight: 900; margin-bottom: 24px; }
    .cta-section p { position: relative; opacity: 0.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; font-size: 1.125rem; }
    .btn-white { display: inline-block; padding: 16px 40px; border-radius: 999px; background: white; color: ${colors.primary}; font-size: 1.1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
    .contact-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 32px; }
    .contact-pill { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 999px; background: #f3f4f6; font-size: 0.875rem; color: #374151; }
    .footer { padding: 40px 32px; background: #111827; text-align: center; }
    .footer p { color: #9ca3af; font-size: 0.875rem; }
    .footer p:last-child { color: #4b5563; margin-top: 8px; font-size: 0.75rem; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2.25rem; }
      .social-proof .metrics { grid-template-columns: repeat(2, 1fr); }
      .pricing-card.highlighted { transform: none; }
    }
  </style>
</head>
<body>
  ${c.hero ? `<div class="hero">
    <h1>${escapeHtml(c.hero.headline)}</h1>
    <p>${escapeHtml(c.hero.subheadline)}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-primary">${escapeHtml(c.hero.primaryCta)}</button>
      ${c.hero.secondaryCta ? `<button class="btn-secondary">${escapeHtml(c.hero.secondaryCta)}</button>` : ""}
    </div>
    ${c.hero.trustBadges?.length ? `<div class="trust-badges">${c.hero.trustBadges.map(b => `<span class="trust-badge">✓ ${escapeHtml(b)}</span>`).join("")}</div>` : ""}
    ${c.hero.socialProof ? `<div style="position:relative;margin-top:56px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.2);"><p style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.15em;opacity:0.6;margin-bottom:20px;">${escapeHtml(c.hero.socialProof.label)}</p><div style="display:flex;gap:40px;justify-content:center;flex-wrap:wrap;opacity:0.7;">${c.hero.socialProof.logos.map(l => `<span style="font-size:1.25rem;font-weight:700;">${escapeHtml(l)}</span>`).join("")}</div></div>` : ""}
  </div>` : ""}

  ${c.socialProof ? `<div class="social-proof">
    ${c.socialProof.headline ? `<p class="label">${escapeHtml(c.socialProof.headline)}</p>` : ""}
    <div class="logos">${c.socialProof.logos.map(l => `<span class="logo">${escapeHtml(l)}</span>`).join("")}</div>
    ${c.socialProof.metrics?.length ? `<div class="metrics">${c.socialProof.metrics.map(m => `<div><div class="metric-val">${escapeHtml(m.value)}</div><div class="metric-lbl">${escapeHtml(m.label)}</div></div>`).join("")}</div>` : ""}
  </div>` : ""}

  ${c.problem ? `<div class="section"><div class="container">
    <h2 class="section-title">${escapeHtml(c.problem.headline)}</h2>
    ${c.problem.description ? `<p class="section-subtitle">${escapeHtml(c.problem.description)}</p>` : ""}
    <div class="grid-2">${c.problem.points?.map(p => `<div class="problem-card"><div class="icon">!</div><p>${escapeHtml(p)}</p></div>`).join("") || ""}</div>
  </div></div>` : ""}

  ${c.solution ? `<div class="section-accent"><div class="container">
    <h2 class="section-title">${escapeHtml(c.solution.headline)}</h2>
    ${c.solution.description ? `<p class="section-subtitle">${escapeHtml(c.solution.description)}</p>` : ""}
    <div class="grid-2">${c.solution.highlights?.map(h => `<div class="solution-card"><div class="icon"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div><p>${escapeHtml(h)}</p></div>`).join("") || ""}</div>
  </div></div>` : ""}

  ${c.benefits?.length ? `<div class="section"><div class="container-wide">
    <h2 class="section-title">Why You'll Love It</h2>
    <div class="grid-3">${c.benefits.map((b, i) => `<div class="card" style="text-align:center;"><div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,${colors.primary},${colors.accent});color:white;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;margin:0 auto 24px;">${b.icon || (i+1)}</div><h3>${escapeHtml(b.title)}</h3><p>${escapeHtml(b.description)}</p></div>`).join("")}</div>
  </div></div>` : ""}

  ${c.features?.length ? `<div class="section-alt"><div class="container-wide">
    <h2 class="section-title">Powerful Features</h2>
    <div class="grid-3">${c.features.map(f => `<div class="card"><div style="width:48px;height:48px;border-radius:12px;background:${colors.primary}10;margin-bottom:20px;display:flex;align-items:center;justify-content:center;"><div style="width:24px;height:24px;border-radius:4px;background:${colors.primary};"></div></div><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.description)}</p></div>`).join("")}</div>
  </div></div>` : ""}

  ${c.howItWorks?.steps?.length ? `<div class="section"><div class="container">
    <h2 class="section-title">${escapeHtml(c.howItWorks.headline)}</h2>
    <div class="grid-3" style="margin-top:48px;">${c.howItWorks.steps.map(s => `<div style="text-align:center;"><div class="step-circle">${s.number}</div><h3 style="font-size:1.25rem;font-weight:700;margin-bottom:12px;">${escapeHtml(s.title)}</h3><p style="color:#6b7280;max-width:280px;margin:0 auto;">${escapeHtml(s.description)}</p></div>`).join("")}</div>
  </div></div>` : ""}

  ${c.statistics?.length ? `<div style="padding:80px 32px;background:linear-gradient(135deg,${colors.primary},${colors.secondary});"><div style="max-width:960px;margin:0 auto;"><div style="display:grid;grid-template-columns:repeat(${Math.min(c.statistics.length, 4)},1fr);gap:40px;text-align:center;color:white;">${c.statistics.map(s => `<div><div class="stat-value">${escapeHtml(s.value)}</div><div class="stat-label">${escapeHtml(s.label)}</div></div>`).join("")}</div></div></div>` : ""}

  ${c.testimonials?.length ? `<div class="section-alt"><div class="container-wide">
    <h2 class="section-title">What Our Customers Say</h2>
    <div class="grid-3">${c.testimonials.map(t => `<div class="testimonial-card"><div class="quote">"${escapeHtml(t.quote)}"</div><div class="author"><div class="avatar">${t.name.split(' ').map((n: string) => n[0]).join('')}</div><div><div class="name">${escapeHtml(t.name)}</div><div class="role">${escapeHtml(t.role)}${t.company ? ` at ${escapeHtml(t.company)}` : ""}</div></div></div></div>`).join("")}</div>
  </div></div>` : ""}

  ${c.pricing?.length ? `<div class="section"><div class="container-wide">
    <h2 class="section-title">Simple, Transparent Pricing</h2>
    <p class="section-subtitle">Choose the plan that fits your needs.</p>
    <div class="grid-3" style="align-items:start;">${c.pricing.map(p => `<div class="pricing-card${p.highlighted ? ' highlighted' : ''}">${p.highlighted ? '<div class="pricing-badge">Most Popular</div>' : ''}<h3>${escapeHtml(p.name)}</h3>${p.description ? `<p style="color:#9ca3af;font-size:0.875rem;margin-top:8px;">${escapeHtml(p.description)}</p>` : ""}<div class="price">${escapeHtml(p.price)}</div>${p.period ? `<div class="period">${escapeHtml(p.period)}</div>` : ""}<ul>${p.features.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul><button class="btn-pricing${p.highlighted ? ' filled' : ''}">${escapeHtml(p.cta)}</button></div>`).join("")}</div>
  </div></div>` : ""}

  ${c.guarantee ? `<div class="guarantee">
    <div class="shield"><svg width="40" height="40" fill="none" stroke="${colors.primary}" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
    <h3 style="font-size:1.5rem;font-weight:900;margin-bottom:12px;">${escapeHtml(c.guarantee.headline)}</h3>
    <p style="color:#6b7280;max-width:560px;margin:0 auto;">${escapeHtml(c.guarantee.description)}</p>
  </div>` : ""}

  ${c.faq?.length ? `<div class="section-alt"><div class="container" style="max-width:700px;">
    <h2 class="section-title">Frequently Asked Questions</h2>
    ${c.faq.map(f => `<div class="faq-card"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`).join("")}
  </div></div>` : ""}

  ${c.finalCta ? `<div class="cta-section">
    <h2>${escapeHtml(c.finalCta.headline)}</h2>
    <p>${escapeHtml(c.finalCta.subheadline)}</p>
    <button class="btn-white">${escapeHtml(c.finalCta.cta)}</button>
  </div>` : ""}

  ${c.contact ? `<div class="section"><div class="container" style="text-align:center;">
    <h2 class="section-title">${escapeHtml(c.contact.headline)}</h2>
    <p style="color:#6b7280;max-width:500px;margin:0 auto;">${escapeHtml(c.contact.description)}</p>
    <div class="contact-row">
      ${c.contact.email ? `<span class="contact-pill">✉ ${escapeHtml(c.contact.email)}</span>` : ""}
      ${c.contact.phone ? `<span class="contact-pill">☎ ${escapeHtml(c.contact.phone)}</span>` : ""}
    </div>
  </div></div>` : ""}

  ${c.footer ? `<div class="footer">
    <p>${escapeHtml(c.footer.description)}</p>
    <p>${escapeHtml(c.footer.copyright)}</p>
  </div>` : ""}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
