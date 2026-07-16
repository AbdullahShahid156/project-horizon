"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { landingPageGenerationSchema, type LandingPageGenerationFormData } from "@/validators/landing-page";
import {
  LANDING_PAGE_SECTIONS,
  LANDING_PAGE_INDUSTRIES,
  BRAND_VOICES,
  GOALS,
  COLOR_PRESETS,
  TYPOGRAPHY_OPTIONS,
} from "@/constants/landing-page";
import { landingPagesService } from "@/services/landing-pages";

const steps = ["Business Info", "Design & Style", "Sections"];

export default function CreateLandingPagePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LandingPageGenerationFormData>({
    resolver: zodResolver(landingPageGenerationSchema) as any,
    defaultValues: {
      language: "English",
      country: "Global",
      primary_cta: "Get Started",
      secondary_cta: "Learn More",
      typography: "Modern Sans-Serif",
      sections_required: [
        "hero",
        "problem",
        "solution",
        "benefits",
        "features",
        "howItWorks",
        "testimonials",
        "pricing",
        "faq",
        "finalCta",
      ],
      color_palette: COLOR_PRESETS[0] as { primary: string; secondary: string; accent: string },
    },
  });

  const selectedSections = watch("sections_required") || [];
  const selectedColors = watch("color_palette");

  const toggleSection = (sectionId: string) => {
    const current = selectedSections;
    if (sectionId === "hero") return;
    if (current.includes(sectionId)) {
      setValue(
        "sections_required",
        current.filter((s) => s !== sectionId),
        { shouldValidate: true }
      );
    } else {
      setValue("sections_required", [...current, sectionId], {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = async (data: LandingPageGenerationFormData) => {
    setGenerating(true);
    try {
      const prompt: any = {
        project_id: "default-project",
        business_name: data.business_name,
        product_name: data.product_name,
        description: data.description,
        industry: data.industry,
        target_audience: data.target_audience,
        primary_goal: data.primary_goal,
        brand_voice: data.brand_voice,
        language: data.language || "English",
        country: data.country || "Global",
        primary_cta: data.primary_cta || "Get Started",
        secondary_cta: data.secondary_cta || "Learn More",
        color_palette: data.color_palette || { primary: "#0066CC", secondary: "#004499", accent: "#00AAFF" },
        typography: data.typography || "Modern Sans-Serif",
        sections_required: data.sections_required || [],
      };

      let aiContent = null;
      try {
        const result = await landingPagesService.generate(prompt);
        aiContent = result.content;
      } catch (err) {
        console.warn("AI generation failed, using fallback:", err);
      }

      const lp = await landingPagesService.create({
        project_id: "default-project",
        name: data.product_name || data.business_name,
        prompt,
        content: aiContent || {
          title: data.product_name,
          hero: {
            headline: `Welcome to ${data.product_name}`,
            subheadline: data.description?.slice(0, 120),
            primaryCta: data.primary_cta || "Get Started",
            secondaryCta: data.secondary_cta || "Learn More",
          },
          problem: { headline: "The Problem", points: [] },
          solution: { headline: "Our Solution", description: data.description },
          benefits: [],
          features: [],
          howItWorks: { headline: "How It Works", steps: [] },
          testimonials: [],
          statistics: [],
          pricing: [],
          faq: [],
          finalCta: { headline: "Ready to Get Started?", subheadline: data.description?.slice(0, 100), cta: data.primary_cta || "Get Started" },
          contact: { headline: "Contact Us", description: "Get in touch with our team." },
          footer: { description: data.description?.slice(0, 100), copyright: `© ${new Date().getFullYear()} ${data.business_name}. All rights reserved.` },
          seo: { title: data.product_name, description: data.description?.slice(0, 160), keywords: [data.industry, data.product_name] },
          twitterCard: { card: "summary_large_image", title: data.product_name, description: data.description?.slice(0, 200) },
          colors: data.color_palette || { primary: "#0066CC", secondary: "#004499", accent: "#00AAFF" },
          typography: data.typography || "Modern Sans-Serif",
        },
      });

      router.push(`/landing-pages/${lp.id}/editor`);
    } catch (err) {
      console.error("Failed to create:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/landing-pages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Landing Page</h1>
          <p className="text-muted-foreground">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Tell us about your business and product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Name *</label>
                      <Input {...register("business_name")} placeholder="Acme Inc" />
                      {errors.business_name && (
                        <p className="text-sm text-destructive">{errors.business_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Name *</label>
                      <Input {...register("product_name")} placeholder="Acme Pro" />
                      {errors.product_name && (
                        <p className="text-sm text-destructive">{errors.product_name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      {...register("description")}
                      placeholder="Describe your product and its value proposition..."
                      rows={3}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry *</label>
                      <Select
                        value={watch("industry")}
                        onValueChange={(v) => setValue("industry", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANDING_PAGE_INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="text-sm text-destructive">{errors.industry.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Audience *</label>
                      <Input
                        {...register("target_audience")}
                        placeholder="Small business owners"
                      />
                      {errors.target_audience && (
                        <p className="text-sm text-destructive">{errors.target_audience.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary Goal *</label>
                      <Select
                        value={watch("primary_goal")}
                        onValueChange={(v) => setValue("primary_goal", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {GOALS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Brand Voice *</label>
                      <Select
                        value={watch("brand_voice")}
                        onValueChange={(v) => setValue("brand_voice", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRAND_VOICES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Design & Style</CardTitle>
                  <CardDescription>Choose colors and typography.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color Palette</label>
                    <div className="grid grid-cols-4 gap-3">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            setValue("color_palette", {
                              primary: preset.primary,
                              secondary: preset.secondary,
                              accent: preset.accent,
                            })
                          }
                          className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                            selectedColors?.primary === preset.primary
                              ? "border-primary"
                              : "border-transparent hover:border-muted"
                          }`}
                          aria-label={`${preset.name} color palette`}
                          aria-pressed={selectedColors?.primary === preset.primary}
                        >
                          <div className="flex gap-1">
                            <div
                              className="h-5 w-5 rounded-full"
                              style={{ background: preset.primary }}
                            />
                            <div
                              className="h-5 w-5 rounded-full"
                              style={{ background: preset.secondary }}
                            />
                            <div
                              className="h-5 w-5 rounded-full"
                              style={{ background: preset.accent }}
                            />
                          </div>
                          <span className="text-xs">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Typography</label>
                    <Select
                      value={watch("typography")}
                      onValueChange={(v) => setValue("typography", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPOGRAPHY_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Primary CTA</label>
                      <Input {...register("primary_cta")} placeholder="Get Started" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Secondary CTA</label>
                      <Input {...register("secondary_cta")} placeholder="Learn More" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Landing Page Sections</CardTitle>
                  <CardDescription>Select which sections to include.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {LANDING_PAGE_SECTIONS.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        disabled={section.required}
                        className={`flex items-center justify-between rounded-lg border-2 p-3 text-left transition-colors ${
                          selectedSections.includes(section.id)
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/20"
                        } ${section.required ? "opacity-70 cursor-not-allowed" : ""}`}
                        role="checkbox"
                        aria-checked={selectedSections.includes(section.id)}
                        aria-label={`${section.label} section${section.required ? " (required)" : ""}`}
                      >
                        <span className="text-sm font-medium">{section.label}</span>
                        {section.required && (
                          <span className="text-xs text-muted-foreground">Required</span>
                        )}
                        {selectedSections.includes(section.id) && !section.required && (
                          <span className="text-xs text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Landing Page
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
