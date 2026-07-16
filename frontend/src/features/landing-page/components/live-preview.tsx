"use client";

import type { LandingPageOutput } from "@/types";

export function LandingPagePreview({ content }: { content: LandingPageOutput | null }) {
  if (!content) return <div className="p-4 text-muted-foreground text-sm">No content</div>;

  const c = content;
  const colors = c.colors || { primary: "#6366f1", secondary: "#4f46e5", accent: "#8b5cf6" };

  return (
    <div className="text-xs space-y-3">
      {/* Hero */}
      {c.hero && (
        <div className="p-4 text-center text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
          <h4 className="font-extrabold text-sm leading-tight">{c.hero.headline}</h4>
          <p className="text-white/70 mt-1 text-[10px] leading-relaxed">{c.hero.subheadline}</p>
          <div className="flex gap-2 justify-center mt-3">
            <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold" style={{ color: colors.primary }}>
              {c.hero.primaryCta}
            </span>
            {c.hero.secondaryCta && (
              <span className="px-3 py-1 rounded-full border border-white/40 text-white text-[10px]">{c.hero.secondaryCta}</span>
            )}
          </div>
          {c.hero.trustBadges && c.hero.trustBadges.length > 0 && (
            <div className="flex gap-2 justify-center mt-2 flex-wrap">
              {c.hero.trustBadges.slice(0, 3).map((b, i) => (
                <span key={i} className="text-[8px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">✓ {b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Social Proof */}
      {c.socialProof && c.socialProof.logos.length > 0 && (
        <div className="p-3 text-center">
          {c.socialProof.headline && <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-2">{c.socialProof.headline}</p>}
          <div className="flex gap-3 justify-center flex-wrap">
            {c.socialProof.logos.slice(0, 5).map((l, i) => (
              <span key={i} className="text-[10px] font-bold text-gray-300">{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Problem */}
      {c.problem && (
        <div className="p-3">
          <h5 className="font-bold text-[11px]">{c.problem.headline}</h5>
          {c.problem.description && <p className="text-gray-400 text-[9px] mt-0.5">{c.problem.description}</p>}
          {c.problem.points?.slice(0, 3).map((p, i) => (
            <p key={i} className="text-gray-500 text-[9px] mt-1 pl-2 border-l-2 border-red-200">{p}</p>
          ))}
        </div>
      )}

      {/* Solution */}
      {c.solution && (
        <div className="p-3 bg-gray-50 rounded">
          <h5 className="font-bold text-[11px]">{c.solution.headline}</h5>
          {c.solution.highlights?.slice(0, 3).map((h, i) => (
            <p key={i} className="text-gray-500 text-[9px] mt-1 pl-2 border-l-2" style={{ borderColor: colors.primary }}>✓ {h}</p>
          ))}
        </div>
      )}

      {/* Benefits */}
      {c.benefits?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-1">Benefits</h5>
          <div className="grid grid-cols-2 gap-1">
            {c.benefits.slice(0, 4).map((b, i) => (
              <div key={i} className="p-2 rounded bg-gray-50">
                <div className="font-semibold text-[9px]">{b.title}</div>
                <p className="text-gray-400 text-[8px]">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {c.features?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-1">Features</h5>
          <div className="space-y-1">
            {c.features.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: colors.primary }} />
                <div>
                  <span className="font-semibold text-[9px]">{f.title}</span>
                  <p className="text-gray-400 text-[8px]">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      {c.howItWorks?.steps?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-2">{c.howItWorks.headline}</h5>
          <div className="space-y-2">
            {c.howItWorks.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ background: colors.accent }}>
                  {s.number}
                </div>
                <div>
                  <div className="font-semibold text-[9px]">{s.title}</div>
                  <div className="text-gray-400 text-[8px]">{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {c.statistics?.length > 0 && (
        <div className="p-3 rounded-lg" style={{ background: colors.primary }}>
          <div className="grid grid-cols-2 gap-2 text-center text-white">
            {c.statistics.map((s, i) => (
              <div key={i}>
                <div className="text-sm font-extrabold">{s.value}</div>
                <div className="text-[8px] opacity-70 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {c.testimonials?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-2">Testimonials</h5>
          {c.testimonials.slice(0, 2).map((t, i) => (
            <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
              <p className="text-gray-500 text-[9px] italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: colors.primary }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-[8px]">{t.name}</div>
                  <div className="text-gray-400 text-[7px]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {c.pricing?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-2 text-center">Pricing</h5>
          <div className="flex gap-1.5">
            {c.pricing.map((p, i) => (
              <div
                key={i}
                className={`flex-1 p-2 rounded-lg border text-center ${
                  p.highlighted ? "border-current shadow-md" : "border-gray-200"
                }`}
                style={p.highlighted ? { borderColor: colors.primary, background: `${colors.primary}08` } : {}}
              >
                {p.highlighted && (
                  <div className="text-[7px] font-bold uppercase tracking-wide mb-1" style={{ color: colors.primary }}>Popular</div>
                )}
                <div className="font-bold text-[10px]">{p.name}</div>
                <div className="text-base font-extrabold" style={{ color: colors.primary }}>{p.price}</div>
                <div className="text-gray-400 text-[7px]">{p.period}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guarantee */}
      {c.guarantee && (
        <div className="p-3 text-center rounded" style={{ background: `${colors.primary}08` }}>
          <div className="text-[10px] font-bold" style={{ color: colors.primary }}>{c.guarantee.headline}</div>
          <p className="text-gray-400 text-[8px] mt-0.5">{c.guarantee.description}</p>
        </div>
      )}

      {/* FAQ */}
      {c.faq?.length > 0 && (
        <div className="p-3">
          <h5 className="font-bold text-[11px] mb-1">FAQ</h5>
          {c.faq.slice(0, 3).map((f, i) => (
            <div key={i} className="mb-1.5 pb-1.5 border-b border-gray-100 last:border-0">
              <div className="font-semibold text-[9px]">{f.question}</div>
              <div className="text-gray-400 text-[8px]">{f.answer}</div>
            </div>
          ))}
        </div>
      )}

      {/* Final CTA */}
      {c.finalCta && (
        <div className="p-4 text-center text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
          <div className="font-extrabold text-[11px]">{c.finalCta.headline}</div>
          <p className="text-white/70 text-[9px] mt-0.5">{c.finalCta.subheadline}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-white rounded-full text-[9px] font-bold" style={{ color: colors.primary }}>{c.finalCta.cta}</span>
        </div>
      )}
    </div>
  );
}
