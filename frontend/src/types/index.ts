export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  updatedAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  joinedAt: string;
};

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export type Permission =
  | 'workspace:create'
  | 'workspace:delete'
  | 'workspace:edit'
  | 'member:invite'
  | 'member:remove'
  | 'member:manage'
  | 'project:create'
  | 'project:delete'
  | 'project:edit'
  | 'settings:read'
  | 'settings:write'
  | 'billing:read'
  | 'billing:write';

export type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  websites?: GeneratedWebsite[];
};

export type GeneratedWebsite = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  currentVersion: number;
  generationPrompt: WebsitePrompt | null;
  aiResponse: WebsiteOutput | null;
  createdAt: string;
  updatedAt: string;
  versions?: WebsiteVersion[];
};

export type WebsiteVersion = {
  id: string;
  websiteId: string;
  versionNumber: number;
  content: WebsiteOutput;
  changeSummary: string | null;
  isAutoSave: boolean;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type ActivityLog = {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Settings = {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
};

export type Session = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type WebsiteStyle =
  | 'modern'
  | 'corporate'
  | 'minimal'
  | 'luxury'
  | 'creative'
  | 'startup'
  | 'technology'
  | 'dark'
  | 'light';

export type WebsiteSection =
  | 'homepage'
  | 'about'
  | 'services'
  | 'portfolio'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'testimonials'
  | 'blog'
  | 'team'
  | 'privacy'
  | 'terms';

export type WebsitePrompt = {
  businessName: string;
  businessDescription: string;
  industry: string;
  targetAudience: string;
  country: string;
  language: string;
  services: string[];
  products: string[];
  businessGoals: string;
  brandPersonality: string;
  brandVoice: string;
  primaryColor: string;
  secondaryColor: string;
  typographyPreference: string;
  callToAction: string;
  competitors: string[];
  websiteStyle: WebsiteStyle;
  preferredSections: WebsiteSection[];
};

export type HeroSection = {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  imageUrl?: string;
  trustBadges?: string[];
  socialProof?: {
    label: string;
    logos: string[];
  };
};

export type FeatureItem = {
  title: string;
  description: string;
  icon?: string;
};

export type BenefitItem = {
  title: string;
  description: string;
};

export type ServiceItem = {
  title: string;
  description: string;
  price?: string;
  features: string[];
};

export type TestimonialItem = {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatarUrl?: string;
};

export type StatItem = {
  label: string;
  value: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
};

export type FooterLink = {
  label: string;
  url: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type NavItem = {
  label: string;
  url: string;
};

export type SeoData = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImageUrl?: string;
};

export type WebsiteOutput = {
  websiteName: string;
  brandSummary: string;
  navigation: NavItem[];
  homepage: {
    hero: HeroSection;
    features: FeatureItem[];
    benefits: BenefitItem[];
    services: ServiceItem[];
    testimonials: TestimonialItem[];
    statistics: StatItem[];
  };
  about: {
    mission: string;
    vision: string;
    values: string[];
  };
  services: ServiceItem[];
  pricing: PricingPlan[];
  faq: FaqItem[];
  contact: {
    headline: string;
    description: string;
    email: string;
    phone?: string;
    address?: string;
    mapUrl?: string;
  };
  footer: {
    description: string;
    columns: FooterColumn[];
    copyright: string;
  };
  team: TeamMember[];
  seo: SeoData;
};

export type LandingPageSeo = {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaOrg?: Record<string, unknown>;
};

export type LandingPageColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TextSection = {
  headline: string;
  description?: string;
  points?: string[];
  highlights?: string[];
};

export type SectionItem = {
  title: string;
  description: string;
  icon?: string;
};

export type HowItWorksStep = {
  number: number;
  title: string;
  description: string;
};

export type HowItWorksSection = {
  headline: string;
  steps: HowItWorksStep[];
};

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating?: number;
  imageUrl?: string;
};

export type Statistic = {
  label: string;
  value: string;
};

export type PricingTier = {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type FinalCtaSection = {
  headline: string;
  subheadline: string;
  cta: string;
};

export type ContactSection = {
  headline: string;
  description: string;
  email?: string;
  phone?: string;
};

export type FooterSection = {
  description: string;
  copyright: string;
};

export type SocialProofMetric = {
  value: string;
  label: string;
};

export type SocialProofSection = {
  headline?: string;
  logos: string[];
  metrics?: SocialProofMetric[];
};

export type GuaranteeSection = {
  headline: string;
  description: string;
  icon?: string;
};

export type LandingPageOutput = {
  title: string;
  hero: HeroSection;
  problem: TextSection;
  solution: TextSection;
  benefits: SectionItem[];
  features: SectionItem[];
  howItWorks: HowItWorksSection;
  socialProof?: SocialProofSection;
  testimonials: Testimonial[];
  statistics: Statistic[];
  pricing: PricingTier[];
  guarantee?: GuaranteeSection;
  faq: FAQItem[];
  finalCta: FinalCtaSection;
  contact: ContactSection;
  footer: FooterSection;
  seo: LandingPageSeo;
  twitterCard: { card: string; title: string; description: string };
  colors: LandingPageColors;
  typography: string;
};

export type LandingPage = {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  currentVersion: number;
  generationPrompt?: LandingPagePrompt | null;
  aiResponse?: LandingPageOutput | null;
  seoData?: LandingPageSeo | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingPagePrompt = {
  project_id: string;
  business_name: string;
  product_name: string;
  description: string;
  industry: string;
  target_audience: string;
  primary_goal: string;
  brand_voice: string;
  language: string;
  country: string;
  primary_cta: string;
  secondary_cta: string;
  color_palette: Record<string, string>;
  typography: string;
  sections_required: string[];
};

export type LandingPageVersion = {
  id: string;
  landingPageId: string;
  versionNumber: number;
  content: LandingPageOutput;
  changeSummary?: string;
  isAutoSave: boolean;
  createdAt: string;
};

export type Template = {
  name: string;
  slug: string;
  description: string;
  category: string;
  content: Record<string, unknown>;
};
