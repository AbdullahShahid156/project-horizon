'use client';

import * as React from 'react';
import type { WebsiteOutput } from '@/types';
import { cn } from '@/lib/utils';

interface WebsitePreviewProps {
  content: WebsiteOutput;
  device: 'desktop' | 'tablet' | 'mobile';
}

export function WebsitePreview({ content, device }: WebsitePreviewProps) {
  const widthClass = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  }[device];

  return (
    <div
      className={cn(
        'mx-auto overflow-hidden rounded-lg border bg-white text-gray-900 shadow-lg transition-all',
        widthClass,
      )}
    >
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-bold">{content.websiteName}</span>
        <div className="hidden gap-4 text-sm md:flex">
          {content.navigation.map((item, i) => (
            <a key={i} href={item.url} className="text-gray-600 hover:text-gray-900">
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-5xl">{content.homepage.hero.headline}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
          {content.homepage.hero.subheadline}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow transition hover:bg-gray-100">
            {content.homepage.hero.primaryCta}
          </button>
          <button className="rounded-lg border border-white/30 px-6 py-3 font-semibold transition hover:bg-white/10">
            {content.homepage.hero.secondaryCta}
          </button>
        </div>
      </section>

      {content.homepage.features.length > 0 && (
        <section className="px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Features</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.homepage.features.map((f, i) => (
              <div key={i} className="rounded-xl border p-6 text-center">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.homepage.statistics.length > 0 && (
        <section className="bg-gray-50 px-6 py-12">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {content.homepage.statistics.map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-blue-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.homepage.testimonials.length > 0 && (
        <section className="px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">What Our Clients Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.homepage.testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border p-6">
                <p className="italic text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-500">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.services.length > 0 && (
        <section className="bg-gray-50 px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Our Services</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.services.map((s, i) => (
              <div key={i} className="rounded-xl border bg-white p-6">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.description}</p>
                {s.price && (
                  <p className="mt-4 text-2xl font-bold text-blue-600">{s.price}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.pricing.length > 0 && (
        <section className="px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Pricing</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {content.pricing.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-xl border p-6',
                  p.highlighted && 'border-blue-600 shadow-lg',
                )}
              >
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-gray-500">/{p.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{p.description}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={cn(
                    'mt-6 w-full rounded-lg py-2 font-semibold transition',
                    p.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 hover:bg-gray-50',
                  )}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.faq.length > 0 && (
        <section className="bg-gray-50 px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
          <div className="mx-auto max-w-2xl space-y-4">
            {content.faq.map((item, i) => (
              <div key={i} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-50 px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">{content.contact.headline}</h2>
        <p className="mx-auto mt-2 max-w-lg text-gray-600">{content.contact.description}</p>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
          <span>{content.contact.email}</span>
          {content.contact.phone && <span>{content.contact.phone}</span>}
          {content.contact.address && <span>{content.contact.address}</span>}
        </div>
      </section>

      <footer className="border-t bg-gray-900 px-6 py-8 text-sm text-gray-400">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p>{content.footer.copyright}</p>
          <div className="flex gap-6">
            {content.footer.columns.map((col, i) => (
              <div key={i}>
                <p className="mb-2 font-semibold text-white">{col.title}</p>
                {col.links.map((link, li) => (
                  <a key={li} href={link.url} className="block hover:text-white">
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
