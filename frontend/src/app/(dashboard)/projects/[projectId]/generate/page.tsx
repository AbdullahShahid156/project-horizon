'use client';

import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared/page-header';
import { websitePromptSchema, type WebsitePromptInput } from '@/validators/generator';
import {
  WEBSITE_STYLES,
  WEBSITE_SECTIONS,
  INDUSTRIES,
  COUNTRIES,
  TYPOGRAPHY_OPTIONS,
  BRAND_PERSONALITIES,
  BRAND_VOICES,
} from '@/constants/generator';
import { cn } from '@/lib/utils';

export default function GeneratorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WebsitePromptInput>({
    resolver: zodResolver(websitePromptSchema),
    defaultValues: {
      businessName: '',
      businessDescription: '',
      industry: '',
      targetAudience: '',
      country: 'United States',
      language: 'English',
      services: [],
      products: [],
      businessGoals: '',
      brandPersonality: '',
      brandVoice: '',
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      typographyPreference: 'sans-serif',
      callToAction: 'Get Started',
      competitors: [],
      websiteStyle: 'modern',
      preferredSections: ['homepage', 'about', 'services', 'contact'],
    },
  });

  const services = watch('services');
  const preferredSections = watch('preferredSections');

  const onSubmit = (data: WebsitePromptInput) => {
    sessionStorage.setItem(
      `generator-prompt-${projectId}`,
      JSON.stringify(data),
    );
    router.push(`/projects/${projectId}/generating`);
  };

  const addService = (value: string) => {
    if (value.trim() && !services.includes(value.trim())) {
      setValue('services', [...services, value.trim()], { shouldValidate: true });
    }
  };

  const removeService = (index: number) => {
    setValue(
      'services',
      services.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  const toggleSection = (section: string) => {
    const current = preferredSections;
    if (current.includes(section)) {
      setValue(
        'preferredSections',
        current.filter((s) => s !== section),
        { shouldValidate: true },
      );
    } else {
      setValue('preferredSections', [...current, section], { shouldValidate: true });
    }
  };

  const [serviceInput, setServiceInput] = React.useState('');

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Website Generator"
        description="Tell us about your business and we'll create a website for you."
      >
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {step === 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Tell us about your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input id="businessName" placeholder="Acme Corp" {...register('businessName')} />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="We provide innovative solutions for..."
                    rows={3}
                    {...register('businessDescription')}
                  />
                  {errors.businessDescription && (
                    <p className="text-sm text-destructive">{errors.businessDescription.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <select
                      id="industry"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      {...register('industry')}
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                    {errors.industry && (
                      <p className="text-sm text-destructive">{errors.industry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience *</Label>
                    <Input
                      id="targetAudience"
                      placeholder="Small business owners, 25-45"
                      {...register('targetAudience')}
                    />
                    {errors.targetAudience && (
                      <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <select
                      id="country"
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      {...register('country')}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language *</Label>
                    <Input id="language" value="English" disabled {...register('language')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessGoals">Business Goals *</Label>
                  <Textarea
                    id="businessGoals"
                    placeholder="Increase online presence, generate leads, sell products..."
                    rows={2}
                    {...register('businessGoals')}
                  />
                  {errors.businessGoals && (
                    <p className="text-sm text-destructive">{errors.businessGoals.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Services *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a service..."
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addService(serviceInput);
                          setServiceInput('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        addService(serviceInput);
                        setServiceInput('');
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {services.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => removeService(i)}
                            className="ml-1 hover:text-destructive"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.services && (
                    <p className="text-sm text-destructive">{errors.services.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competitors">Competitors (optional, comma separated)</Label>
                  <Input
                    id="competitors"
                    placeholder="competitor1.com, competitor2.com"
                    onChange={(e) => {
                      const val = e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setValue('competitors', val);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Brand Identity</CardTitle>
                <CardDescription>Define your brand personality and style.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Brand Personality *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BRAND_PERSONALITIES.map((p) => (
                        <label
                          key={p}
                          className={cn(
                            'flex cursor-pointer items-center rounded-lg border p-3 text-sm transition-colors hover:bg-accent',
                            watch('brandPersonality') === p &&
                              'border-primary bg-primary/5 text-primary',
                          )}
                        >
                          <input
                            type="radio"
                            value={p}
                            className="sr-only"
                            {...register('brandPersonality')}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                    {errors.brandPersonality && (
                      <p className="text-sm text-destructive">{errors.brandPersonality.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Brand Voice *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BRAND_VOICES.map((v) => (
                        <label
                          key={v}
                          className={cn(
                            'flex cursor-pointer items-center rounded-lg border p-3 text-sm transition-colors hover:bg-accent',
                            watch('brandVoice') === v &&
                              'border-primary bg-primary/5 text-primary',
                          )}
                        >
                          <input
                            type="radio"
                            value={v}
                            className="sr-only"
                            {...register('brandVoice')}
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                    {errors.brandVoice && (
                      <p className="text-sm text-destructive">{errors.brandVoice.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color *</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        className="h-9 w-9 cursor-pointer rounded border"
                        {...register('primaryColor')}
                      />
                      <Input {...register('primaryColor')} className="font-mono" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color *</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="secondaryColor"
                        className="h-9 w-9 cursor-pointer rounded border"
                        {...register('secondaryColor')}
                      />
                      <Input {...register('secondaryColor')} className="font-mono" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Typography *</Label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      {...register('typographyPreference')}
                    >
                      {TYPOGRAPHY_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callToAction">Primary Call to Action *</Label>
                  <Input
                    id="callToAction"
                    placeholder="Get Started, Contact Us, Shop Now..."
                    {...register('callToAction')}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Website Style</CardTitle>
                <CardDescription>Choose the visual style for your website.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-3">
                  {WEBSITE_STYLES.map((style) => (
                    <label
                      key={style.value}
                      className={cn(
                        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-md',
                        watch('websiteStyle') === style.value &&
                          'border-primary ring-1 ring-primary shadow-sm',
                      )}
                    >
                      <input
                        type="radio"
                        value={style.value}
                        className="sr-only"
                        {...register('websiteStyle')}
                      />
                      <span className="text-sm font-medium">{style.label}</span>
                      <span className="text-xs text-muted-foreground">{style.description}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
                <CardDescription>Select which sections to include on your website.</CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="preferredSections"
                  render={() => (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {WEBSITE_SECTIONS.map((section) => (
                        <label
                          key={section.value}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent',
                            preferredSections.includes(section.value) &&
                              'border-primary bg-primary/5',
                          )}
                        >
                          <Checkbox
                            checked={preferredSections.includes(section.value)}
                            onCheckedChange={() => toggleSection(section.value)}
                            disabled={section.required}
                          />
                          {section.label}
                          {section.required && (
                            <span className="text-xs text-muted-foreground">(required)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.preferredSections && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.preferredSections.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 0 ? 'Cancel' : 'Previous'}
          </Button>

          {step < 2 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Website
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
