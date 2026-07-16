# Architecture Documentation

## Overview

BuilderWeb follows a modern SaaS architecture with a Next.js frontend and FastAPI backend, connected to a PostgreSQL database via Supabase.

## Frontend Architecture

### App Router Structure

The application uses Next.js App Router with route groups:

- `(auth)` - Authentication pages (login, signup, forgot/reset password, verify email)
- `(dashboard)` - Protected dashboard pages (home, profile, organizations, workspaces, settings)

### Feature-Based Architecture

Each feature is self-contained in `src/features/`:

```
features/
  auth/           - Authentication components and logic
  dashboard/      - Dashboard-specific components
  organizations/  - Organization management
  workspaces/     - Workspace management
  profile/        - User profile
  settings/       - Settings pages
  projects/       - Project management and website editor
  landing-page/   - Landing page builder (components, utils)
  editor/         - Website editor shared components
  generator/      - AI website generation
  notifications/  - Notifications
```

### Component Hierarchy

```
RootLayout (ClerkProvider + ThemeProvider + ToastProvider)
├── Landing Page (public)
└── AuthGroupLayout
    └── DashboardLayout
        ├── DashboardSidebar
        ├── DashboardHeader
        └── Main Content
            ├── Dashboard Page
            ├── Profile Page
            ├── Organizations
            ├── Workspaces
            ├── Content Studio (list, create, editor, versions, export, templates)
            ├── SEO Studio (domains, dashboard, audit, keywords, on-page, technical, content, schemas, links, reports, competitors, history)
            ├── Performance Studio (audits, vitals, recommendations, images, assets, history, reports)
            └── Settings (SettingsLayout)
```

## Backend Architecture

### AI Engine Architecture

The AI engine (`app/engine/`) is a centralized layer that powers all AI features:

```
engine/
  __init__.py         - Engine exports
  engine.py           - Main AIEngine class (orchestrates everything)
  providers/
    base.py           - AIProvider ABC, ProviderConfig, ProviderResponse, TokenUsage
    gemini.py         - Google Gemini implementation
    stubs.py          - OpenAI, Claude, Groq, OpenRouter, Local (future-ready)
    registry.py       - Provider registry and factory
  prompts/
    library.py        - PromptLibrary with versioning and categorization
    defaults.py       - 10 default prompt templates
  parsers/
    __init__.py       - OutputParser (JSON parsing, repair, validation)
  cache/
    __init__.py       - AICache (in-memory, TTL, hit tracking)
  queue/
    __init__.py       - AIJobQueue (async jobs, retry, cancellation)
  analytics/
    __init__.py       - UsageTracker (tokens, costs, latency, breakdown)
  generators/
    generators.py     - Typed generators (Website, LandingPage, SEO, Blog, etc.)
```

### API Structure

```
/api/v1/
  /health          - Health check
  /users           - User management
  /projects        - Project CRUD and website management
  /websites        - Website version management and auto-save
  /ai              - AI generation and copy improvement (legacy)
  /engine          - AI Core Engine (providers, prompts, jobs, usage, cache)
  /landing-pages   - Landing page CRUD, generation, versioning, copy improvement
  /templates       - Landing page template gallery
  /content         - Content Studio (CRUD, AI generate, AI optimize, SEO, export, folders, tags, templates, versions)
  /seo             - SEO Studio (domains, audits, keywords, on-page, technical, content, schemas, links, reports, competitors, history)
  /performance     - Performance Studio (audits, vitals, recommendations, images, assets, history, reports, export)
```

### Database Models

- User - Core user information
- Organization - Multi-tenant organizations
- Membership - User-organization relationships with roles
- Workspace - Organizational workspaces
- Project - Projects within workspaces
- GeneratedWebsite - AI-generated website content and metadata
- WebsiteVersion - Versioned snapshots of website content
- LandingPage - AI-generated landing pages with SEO data
- LandingPageVersion - Versioned snapshots of landing page content
- LandingPageTemplate - Pre-built landing page templates
- ContentItem - Content studio items (26 content types, status, tags, favorites, archive)
- ContentVersion - Versioned snapshots of content with change summaries
- ContentTemplate - Reusable content generation templates
- ContentFolder - Hierarchical folder organization
- ContentTag - Tagging system for content
- ContentExport - Export history tracking
- SEODomain - SEO tracking domains with scores
- SEOAudit - SEO audit results with scores and issues
- SEOAuditPage - Individual page audit data
- SEOKeyword - Tracked keywords with volume/difficulty/CPC/intent
- SEOKeywordCluster - Keyword grouping for topic clusters
- SEOKeywordRanking - Keyword position tracking over time
- SEOSchema - Schema.org JSON-LD markup
- SEOReport - Generated SEO reports
- SEORecommendation - SEO improvement recommendations
- SEOCompetitor - Tracked competitor domains
- SEOHistory - SEO event history timeline
- SEOInternalLink - Internal linking suggestions
- PerformanceAudit - Website performance audit results
- CoreWebVitals - Core Web Vitals metrics (LCP, INP, CLS, FCP, TTFB, Speed Index, TBT)
- PerformanceRecommendation - Performance improvement recommendations
- OptimizationHistory - Performance optimization event history
- PerformanceReport - Generated performance reports
- ImageAudit - Image optimization audit data
- AssetAudit - Asset (JS/CSS/HTML/Font) optimization audit data
- Notification - User notifications
- ActivityLog - User activity tracking
- Settings - User preferences
- Session - User sessions
- AuditLog - Audit trail

## Authentication Flow

1. User authenticates via Clerk (email/password or social login)
2. Clerk issues JWT session token
3. Clerk middleware protects routes
4. Backend validates Clerk session via JWT verification
5. Role-based access control enforced on API endpoints

## Design System

- 8px spacing grid system
- CSS variables for theming (light/dark)
- Accessible color tokens
- shadcn/ui component primitives
- Custom animations with Framer Motion (ready for future use)
