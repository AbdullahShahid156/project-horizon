# BuilderWeb - AI Business Website Builder & Optimization Platform

A production-ready SaaS platform for building and optimizing AI-powered business websites.

## Architecture

```
/
├── frontend/          # Next.js 16 application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   │   ├── (auth)    # Auth pages (login, signup, forgot/reset password, verify email)
│   │   │   ├── (dashboard)/ # Protected dashboard pages
│   │   │   │   ├── dashboard/  # Home dashboard
│   │   │   │   ├── profile/    # User profile
│   │   │   │   ├── projects/   # Projects CRUD + AI Generator + Editor
│   │   │   │   ├── organizations/ # Organization management
│   │   │   │   ├── workspaces/   # Workspace management
│   │   │   │   └── settings/     # Settings (general, security, notifications, billing, api-keys, appearance)
│   │   │   └── api/       # API routes
│   │   ├── components/   # UI components (shadcn/ui) and shared components
│   │   ├── features/     # Feature-based modules (projects, generator, editor)
│   │   ├── layouts/      # Layout components (dashboard, auth, settings)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript type definitions
│   │   ├── validators/   # Zod validation schemas
│   │   ├── constants/    # Application constants
│   │   ├── providers/    # React context providers
│   │   ├── lib/          # Library functions
│   │   └── config/       # Application configuration
│   └── prisma/           # Database schema and migrations
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/v1/       # API routes (health, users, projects, websites, ai)
│   │   ├── core/         # Config, database, AI service, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── tests/            # Test suite
└── .github/              # GitHub Actions workflows
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui
- **Backend:** FastAPI (Python), SQLAlchemy, Pydantic
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Clerk
- **AI:** Google Gemini (with provider abstraction)
- **Storage:** Supabase Storage
- **Deployment:** Vercel (Frontend), Railway (Backend)

## Phase 2 - AI Website Generator

### Features

- **Project Management:** Create, rename, archive, duplicate, delete projects
- **AI Website Generation:** Multi-step form with business info, brand identity, style, and sections
- **Live Preview:** Real-time website preview during generation
- **Visual Editor:** Edit all website sections (hero, features, services, pricing, FAQ, contact, SEO)
- **Auto-Save:** Automatic saving every 30 seconds
- **Version History:** Track all changes, restore any version
- **Responsive Preview:** Preview in desktop, tablet, and mobile views
- **Export:** Download as JSON, Markdown, HTML, or ZIP
- **Undo/Redo:** Full undo/redo support in editor

### User Flow

1. Dashboard → New Project → Enter project details
2. Project → Generate Website → Fill 3-step form (Business Info, Brand Identity, Style & Sections)
3. AI generates complete website structure
4. Editor with live preview → Edit any section
5. Auto-save + manual save → Version history
6. Preview in different devices
7. Export in multiple formats

### Backend AI Service

- Provider abstraction (Gemini, future OpenAI/Claude support)
- Structured JSON response format
- Error handling with retry support
- API endpoint: `/api/v1/ai/generate-website`

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL
- Google Gemini API key

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in environment variables (including GEMINI_API_KEY for AI)
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in environment variables
uvicorn app.main:app --reload
```

### Environment Variables

#### Frontend (.env.local)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

#### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - Gemini model name (default: gemini-2.0-flash)
- `AI_PROVIDER` - AI provider (default: gemini)

## Project Status

### Phase 1: Foundation ✅
- Authentication (Clerk)
- User management
- Organization management
- Workspace management
- Dashboard UI
- Settings pages
- Database schema
- Design system
- Responsive layout
- Dark/light mode

### Phase 2: AI Website Generator ✅
- Project CRUD
- AI website generation form
- Generation loading screen
- Visual editor with live preview
- Auto-save
- Version history
- Responsive preview
- Export (JSON, Markdown, HTML, ZIP)
- Undo/redo
- Backend AI service with provider abstraction

### Phase 3: AI Landing Page Builder ✅
- 3-step creation wizard (Business Info, Design, Sections)
- AI-powered landing page generation (Gemini)
- Visual editor with section-by-section editing
- Live preview panel with device switching (Desktop/Tablet/Mobile)
- AI copy improvement (9 actions: improve, regenerate, shorten, expand, professional, friendly, luxury, startup, technical)
- Drag-and-drop section reordering
- Media panel with file upload, URL input, and stock images
- SEO panel (meta title, description, keywords, Open Graph, Twitter Card)
- Auto-save (30s interval)
- Version history with restore
- Template gallery (6 templates: SaaS, Agency, E-commerce, Startup, Local Business, Event)
- Export (HTML, Markdown, JSON, ZIP)
- Undo/redo (50-level)
- Backend: Pydantic validation, auth (Bearer token), rate limiting, AI provider abstraction
- Accessibility: ARIA labels, keyboard navigation, focus states
- Responsive design: Desktop, Tablet, Mobile

### Phase 4: AI Core Engine ✅
- Centralized AI engine with provider abstraction
- Supported providers: Gemini (active), OpenAI/Claude/Groq/OpenRouter/Local (stubs)
- Prompt management library with versioning and categorization
- 10 prompt categories: website, landing_page, copywriting, seo, blog, email, ads, social, product, support
- Structured output parsing with automatic JSON repair
- In-memory cache with TTL, hit rate tracking, and pattern invalidation
- Job queue with async processing, retry, and cancellation
- Token tracking (prompt/completion/total tokens, estimated cost)
- Usage analytics (generations, costs, latency, success rate, provider/model breakdown)
- Streaming response support
- Rate limiting per endpoint
- Frontend usage dashboard with daily charts, history, breakdown, and cache stats
- All existing endpoints migrated to use the engine
- Backend: 14 new API endpoints under /api/v1/engine/*

### Phase 5: AI Content Studio ✅
- Content Studio dashboard with grid/list view, search, filtering, sorting, pagination
- 26 content types: Blog Posts, Product Descriptions, Landing Page Copy, Website Copy, Service Pages, About Us, Email Campaigns, Cold Emails, Newsletters, Facebook Ads, Instagram Captions, LinkedIn Posts, X (Twitter) Posts, Google Search Ads, YouTube Titles/Descriptions, Video Scripts, FAQs, Taglines, Headlines, CTAs, Meta Titles/Descriptions, Press Releases, Case Studies, Sales Letters
- AI content generation with dynamic form (business name, product, industry, audience, tone, length, goal, keywords, CTA)
- Rich text editor with formatting toolbar (bold, italic, underline, headings, lists, links, quotes, code blocks, undo/redo)
- 14 AI optimization actions: Generate, Regenerate, Rewrite, Expand, Shorten, Professional, Friendly, Luxury, Startup, Technical, Persuasive, Simplify, Grammar Fix, SEO Optimize
- Live SEO analysis (score, keyword density, readability, heading analysis, internal/external links, suggestions)
- Content versioning with timeline view and restore
- Content templates (create, duplicate, delete, use count tracking)
- Content folders and tags for organization
- Export to HTML, Markdown, Plain Text, JSON
- Favorites, archive, bulk operations
- Auto-save with debounce
- Backend: 30+ API endpoints under /api/v1/content/*
- Database models: ContentItem, ContentVersion, ContentTemplate, ContentFolder, ContentTag, ContentExport

### Phase 6: Enterprise AI SEO Studio ✅
- SEO Domain management (add, track, delete websites)
- SEO Dashboard (health score, technical score, content score, keyword coverage, broken links, missing meta, schema coverage, indexability, issues summary)
- SEO Audit with AI-powered analysis (overall/technical/content/on-page scores, issues, recommendations, metrics)
- Keyword Research with AI generation (primary, secondary, long-tail, question, local SEO keywords; search volume, difficulty, CPC, intent classification)
- Keyword Clusters (create clusters, add keywords to clusters, pillar keyword grouping)
- On-Page SEO Analysis (meta title/description, slug, canonical, OG tags, Twitter cards, heading structure, image ALT tags, recommendations)
- Technical SEO Analysis (broken links, duplicate titles, missing H1, missing ALT, canonical, robots.txt, sitemap, redirect chain detection)
- Content Optimization (keyword density, readability score, heading suggestions, FAQ suggestions, optimized title/meta)
- Schema Generator supporting 10 types: Organization, Local Business, Product, FAQ, Article, Breadcrumb, WebSite, Service, Person, Event
- AI-powered Schema.org JSON-LD generation
- Internal Linking (AI-powered suggestions, anchor text, implement tracking)
- SEO Reports (generate, score, issues count, recommendations count, export)
- Recommendations engine (priority-based: critical/high/medium/low, resolve tracking, impact/effort labels)
- Competitor Analysis (add competitors, AI-powered comparison with strengths, weaknesses, keyword opportunities, content gaps)
- SEO History timeline (event tracking, score history)
- Export to JSON, Markdown, HTML, CSV
- AI suggestions (keyword, headline, meta, FAQ, rewrite, optimize, expand, simplify, generate)
- Backend: 30+ API endpoints under /api/v1/seo/*
- Database models: SEODomain, SEOAudit, SEOAuditPage, SEOKeyword, SEOKeywordCluster, SEOKeywordRanking, SEOSchema, SEOReport, SEORecommendation, SEOCompetitor, SEOHistory, SEOInternalLink

### Phase 7: Website Performance & Optimization Studio ✅
- Performance Dashboard (overall, performance, accessibility, best practices, SEO scores; trend graph; optimization progress)
- Performance Audit with comprehensive analysis (images, JS, CSS, fonts, unused assets, render blocking, lazy loading, caching, compression, third-party scripts, network requests, DOM size)
- Core Web Vitals tracking (LCP, INP, CLS, FCP, TTFB, Speed Index, TBT) with status indicators (good/needs-improvement/poor)
- AI-powered optimization recommendations (critical/high/medium/low priority, problem, impact, estimated improvement, implementation guide)
- Image Optimization analysis (format, size, lazy loading, ALT text, WebP recommendations, savings calculation)
- Asset Optimization analysis (minification, render blocking, unused detection, cache control, ETag, gzip size)
- Cache Analysis (browser cache, CDN, HTTP headers, ETag, compression)
- Network Analysis (requests, waterfall, slow resources, large files, duplicate assets, third-party)
- Performance History timeline with score tracking
- Performance Reports (generate, score, summary, export)
- Export to JSON, CSV, HTML, Markdown
- Backend: 16 API endpoints under /api/v1/performance/*
- Database models: PerformanceAudit, CoreWebVitals, PerformanceRecommendation, OptimizationHistory, PerformanceReport, ImageAudit, AssetAudit

### Phase 8+: Coming Soon
- Real website deployment
- Custom domain support
- Analytics dashboard
- A/B testing
- Template marketplace
