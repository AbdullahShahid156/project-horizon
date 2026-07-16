'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { WebsiteOutput } from '@/types';

interface EditorPanelProps {
  content: WebsiteOutput;
  onUpdate: (path: string, value: unknown) => void;
}

export function EditorPanel({ content, onUpdate }: EditorPanelProps) {
  const [activeSection, setActiveSection] = React.useState('hero');

  const sections = [
    { id: 'hero', label: 'Hero' },
    { id: 'features', label: 'Features' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'services', label: 'Services' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'about', label: 'About' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sections
        </p>
      </div>

      <div className="flex">
        <div className="w-32 border-r bg-muted/30">
          <nav className="flex flex-col gap-0.5 p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeSection === 'hero' && (
            <HeroEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'features' && (
            <FeaturesEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'benefits' && (
            <BenefitsEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'services' && (
            <ServicesEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'testimonials' && (
            <TestimonialsEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'statistics' && (
            <StatisticsEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'about' && (
            <AboutEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'pricing' && (
            <PricingEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'faq' && (
            <FaqEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'contact' && (
            <ContactEditor content={content} onUpdate={onUpdate} />
          )}
          {activeSection === 'seo' && (
            <SeoEditor content={content} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function HeroEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  const hero = content.homepage.hero;
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Hero Section</h3>
      <FieldGroup label="Headline">
        <Input
          value={hero.headline}
          onChange={(e) => onUpdate('homepage.hero.headline', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup label="Subheadline">
        <Textarea
          value={hero.subheadline}
          rows={2}
          onChange={(e) => onUpdate('homepage.hero.subheadline', e.target.value)}
        />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Primary CTA">
          <Input
            value={hero.primaryCta}
            onChange={(e) => onUpdate('homepage.hero.primaryCta', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Secondary CTA">
          <Input
            value={hero.secondaryCta}
            onChange={(e) => onUpdate('homepage.hero.secondaryCta', e.target.value)}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function FeaturesEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Features</h3>
      {content.homepage.features.map((feature, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <FieldGroup label={`Feature ${i + 1} - Title`}>
            <Input
              value={feature.title}
              onChange={(e) => onUpdate(`homepage.features.${i}.title`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Description">
            <Textarea
              value={feature.description}
              rows={2}
              onChange={(e) => onUpdate(`homepage.features.${i}.description`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function BenefitsEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Benefits</h3>
      {content.homepage.benefits.map((benefit, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <FieldGroup label={`Benefit ${i + 1} - Title`}>
            <Input
              value={benefit.title}
              onChange={(e) => onUpdate(`homepage.benefits.${i}.title`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Description">
            <Textarea
              value={benefit.description}
              rows={2}
              onChange={(e) => onUpdate(`homepage.benefits.${i}.description`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function ServicesEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Services</h3>
      {content.services.map((service, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <FieldGroup label={`Service ${i + 1} - Title`}>
            <Input
              value={service.title}
              onChange={(e) => onUpdate(`services.${i}.title`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Description">
            <Textarea
              value={service.description}
              rows={2}
              onChange={(e) => onUpdate(`services.${i}.description`, e.target.value)}
            />
          </FieldGroup>
          {service.price !== undefined && (
            <FieldGroup label="Price">
              <Input
                value={service.price}
                onChange={(e) => onUpdate(`services.${i}.price`, e.target.value)}
              />
            </FieldGroup>
          )}
        </div>
      ))}
    </div>
  );
}

function TestimonialsEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Testimonials</h3>
      {content.homepage.testimonials.map((t, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Name">
              <Input
                value={t.name}
                onChange={(e) => onUpdate(`homepage.testimonials.${i}.name`, e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Role">
              <Input
                value={t.role}
                onChange={(e) => onUpdate(`homepage.testimonials.${i}.role`, e.target.value)}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Quote">
            <Textarea
              value={t.quote}
              rows={2}
              onChange={(e) => onUpdate(`homepage.testimonials.${i}.quote`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function StatisticsEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Statistics</h3>
      {content.homepage.statistics.map((stat, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border p-3">
          <FieldGroup label="Value">
            <Input
              value={stat.value}
              onChange={(e) => onUpdate(`homepage.statistics.${i}.value`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Label">
            <Input
              value={stat.label}
              onChange={(e) => onUpdate(`homepage.statistics.${i}.label`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function AboutEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">About</h3>
      <FieldGroup label="Mission">
        <Textarea
          value={content.about.mission}
          rows={3}
          onChange={(e) => onUpdate('about.mission', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup label="Vision">
        <Textarea
          value={content.about.vision}
          rows={3}
          onChange={(e) => onUpdate('about.vision', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup label="Values (comma separated)">
        <Input
          value={content.about.values.join(', ')}
          onChange={(e) => onUpdate('about.values', e.target.value.split(',').map((s) => s.trim()))}
        />
      </FieldGroup>
      <Separator />
      <h4 className="text-sm font-semibold">Team</h4>
      {content.team.map((member, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Name">
              <Input
                value={member.name}
                onChange={(e) => onUpdate(`team.${i}.name`, e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Role">
              <Input
                value={member.role}
                onChange={(e) => onUpdate(`team.${i}.role`, e.target.value)}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Bio">
            <Textarea
              value={member.bio}
              rows={2}
              onChange={(e) => onUpdate(`team.${i}.bio`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function PricingEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Pricing Plans</h3>
      {content.pricing.map((plan, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Plan Name">
              <Input
                value={plan.name}
                onChange={(e) => onUpdate(`pricing.${i}.name`, e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Price">
              <Input
                value={plan.price}
                onChange={(e) => onUpdate(`pricing.${i}.price`, e.target.value)}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Description">
            <Textarea
              value={plan.description}
              rows={2}
              onChange={(e) => onUpdate(`pricing.${i}.description`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="CTA Button">
            <Input
              value={plan.cta}
              onChange={(e) => onUpdate(`pricing.${i}.cta`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function FaqEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">FAQ</h3>
      {content.faq.map((item, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-3">
          <FieldGroup label={`Question ${i + 1}`}>
            <Input
              value={item.question}
              onChange={(e) => onUpdate(`faq.${i}.question`, e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Answer">
            <Textarea
              value={item.answer}
              rows={3}
              onChange={(e) => onUpdate(`faq.${i}.answer`, e.target.value)}
            />
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}

function ContactEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Contact</h3>
      <FieldGroup label="Headline">
        <Input
          value={content.contact.headline}
          onChange={(e) => onUpdate('contact.headline', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup label="Description">
        <Textarea
          value={content.contact.description}
          rows={2}
          onChange={(e) => onUpdate('contact.description', e.target.value)}
        />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Email">
          <Input
            value={content.contact.email}
            onChange={(e) => onUpdate('contact.email', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Phone">
          <Input
            value={content.contact.phone ?? ''}
            onChange={(e) => onUpdate('contact.phone', e.target.value)}
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Address">
        <Input
          value={content.contact.address ?? ''}
          onChange={(e) => onUpdate('contact.address', e.target.value)}
        />
      </FieldGroup>
    </div>
  );
}

function SeoEditor({ content, onUpdate }: { content: WebsiteOutput; onUpdate: (path: string, value: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">SEO</h3>
      <FieldGroup label="Meta Title">
        <Input
          value={content.seo.metaTitle}
          onChange={(e) => onUpdate('seo.metaTitle', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{content.seo.metaTitle.length}/60 characters</p>
      </FieldGroup>
      <FieldGroup label="Meta Description">
        <Textarea
          value={content.seo.metaDescription}
          rows={2}
          onChange={(e) => onUpdate('seo.metaDescription', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{content.seo.metaDescription.length}/160 characters</p>
      </FieldGroup>
      <FieldGroup label="Keywords (comma separated)">
        <Input
          value={content.seo.keywords.join(', ')}
          onChange={(e) => onUpdate('seo.keywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      </FieldGroup>
      <Separator />
      <FieldGroup label="OG Title">
        <Input
          value={content.seo.ogTitle}
          onChange={(e) => onUpdate('seo.ogTitle', e.target.value)}
        />
      </FieldGroup>
      <FieldGroup label="OG Description">
        <Textarea
          value={content.seo.ogDescription}
          rows={2}
          onChange={(e) => onUpdate('seo.ogDescription', e.target.value)}
        />
      </FieldGroup>
    </div>
  );
}
