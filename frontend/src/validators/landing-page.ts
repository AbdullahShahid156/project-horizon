import { z } from "zod";

export const landingPageGenerationSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  product_name: z.string().min(1, "Product name is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  industry: z.string().min(1, "Industry is required"),
  target_audience: z.string().min(1, "Target audience is required"),
  primary_goal: z.string().min(1, "Primary goal is required"),
  brand_voice: z.string().min(1, "Brand voice is required"),
  language: z.string(),
  country: z.string(),
  primary_cta: z.string().min(1, "Primary CTA is required"),
  secondary_cta: z.string(),
  color_palette: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
    })
    .optional(),
  typography: z.string(),
  sections_required: z.array(z.string()),
});

export type LandingPageGenerationFormData = z.infer<
  typeof landingPageGenerationSchema
>;
