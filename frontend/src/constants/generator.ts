export const WEBSITE_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean lines, bold typography, vibrant colors' },
  { value: 'corporate', label: 'Corporate', description: 'Professional, trustworthy, structured' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, elegant, whitespace-focused' },
  { value: 'luxury', label: 'Luxury', description: 'Premium feel, dark tones, gold accents' },
  { value: 'creative', label: 'Creative', description: 'Artistic, playful, unique layouts' },
  { value: 'startup', label: 'Startup', description: 'Fresh, energetic, growth-oriented' },
  { value: 'technology', label: 'Technology', description: 'Technical, futuristic, data-driven' },
  { value: 'dark', label: 'Dark', description: 'Dark backgrounds, neon accents' },
  { value: 'light', label: 'Light', description: 'Bright, airy, clean aesthetic' },
] as const;

export const WEBSITE_SECTIONS = [
  { value: 'homepage', label: 'Homepage', required: true },
  { value: 'about', label: 'About', required: true },
  { value: 'services', label: 'Services', required: false },
  { value: 'portfolio', label: 'Portfolio', required: false },
  { value: 'pricing', label: 'Pricing', required: false },
  { value: 'faq', label: 'FAQ', required: false },
  { value: 'contact', label: 'Contact', required: false },
  { value: 'testimonials', label: 'Testimonials', required: false },
  { value: 'blog', label: 'Blog', required: false },
  { value: 'team', label: 'Team', required: false },
  { value: 'privacy', label: 'Privacy Policy', required: false },
  { value: 'terms', label: 'Terms of Service', required: false },
] as const;

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Real Estate',
  'Food & Restaurant',
  'Travel & Hospitality',
  'Marketing & Advertising',
  'Legal',
  'Consulting',
  'Manufacturing',
  'Non-profit',
  'Entertainment',
  'Fitness & Wellness',
  'Automotive',
  'Fashion',
  'Photography',
  'Construction',
  'Agriculture',
  'Other',
] as const;

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'India',
  'Brazil',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Singapore',
  'United Arab Emirates',
  'South Korea',
  'Italy',
  'Spain',
  'Mexico',
  'Other',
] as const;

export const TYPOGRAPHY_OPTIONS = [
  { value: 'sans-serif', label: 'Sans Serif', description: 'Clean and modern (Inter, Roboto)' },
  { value: 'serif', label: 'Serif', description: 'Traditional and elegant (Playfair, Lora)' },
  { value: 'monospace', label: 'Monospace', description: 'Technical and precise (Fira Code)' },
  { value: 'display', label: 'Display', description: 'Bold and attention-grabbing' },
  { value: 'mixed', label: 'Mixed', description: 'Combination for visual hierarchy' },
] as const;

export const BRAND_PERSONALITIES = [
  'Professional',
  'Friendly',
  'Innovative',
  'Trustworthy',
  'Bold',
  'Playful',
  'Sophisticated',
  'Approachable',
  'Authoritative',
  'Minimal',
] as const;

export const BRAND_VOICES = [
  'Formal',
  'Casual',
  'Technical',
  'Conversational',
  'Inspirational',
  'Direct',
  'Humorous',
  'Educational',
  'Persuasive',
  'Empathetic',
] as const;

export const GENERATION_STEPS = [
  { id: 1, label: 'Analyzing your business', description: 'Understanding your brand and goals' },
  { id: 2, label: 'Generating brand identity', description: 'Creating your brand summary and voice' },
  { id: 3, label: 'Building navigation', description: 'Structuring your site navigation' },
  { id: 4, label: 'Creating homepage', description: 'Designing hero, features, and sections' },
  { id: 5, label: 'Writing content', description: 'Generating compelling copy' },
  { id: 6, label: 'Optimizing for SEO', description: 'Adding meta tags and keywords' },
  { id: 7, label: 'Finalizing', description: 'Reviewing and polishing your website' },
] as const;
