import { z } from 'zod';

export const websitePromptSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  businessDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  industry: z.string().min(1, 'Industry is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  country: z.string().min(1, 'Country is required'),
  language: z.string().min(1, 'Language is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  products: z.array(z.string()),
  businessGoals: z.string().min(1, 'Business goals are required'),
  brandPersonality: z.string().min(1, 'Brand personality is required'),
  brandVoice: z.string().min(1, 'Brand voice is required'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  typographyPreference: z.string().min(1, 'Typography preference is required'),
  callToAction: z.string().min(1, 'Call to action is required'),
  competitors: z.array(z.string()),
  websiteStyle: z.enum([
    'modern',
    'corporate',
    'minimal',
    'luxury',
    'creative',
    'startup',
    'technology',
    'dark',
    'light',
  ]),
  preferredSections: z
    .array(z.string())
    .min(1, 'Select at least one section'),
});

export type WebsitePromptInput = z.infer<typeof websitePromptSchema>;

export const projectCreateSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string().uuid(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
