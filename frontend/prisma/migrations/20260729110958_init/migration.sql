-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "imageUrl" VARCHAR(500),
    "authProvider" VARCHAR(50) NOT NULL DEFAULT 'supabase',
    "authProviderId" VARCHAR(255),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "logoUrl" VARCHAR(500),
    "plan" VARCHAR(50) NOT NULL DEFAULT 'free',
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" VARCHAR(255),
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "status" VARCHAR(20) NOT NULL DEFAULT 'accepted',
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "theme" VARCHAR(50) NOT NULL DEFAULT 'system',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "entityType" VARCHAR(50),
    "entityId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "entityName" VARCHAR(255) NOT NULL DEFAULT '',
    "description" VARCHAR(500),
    "icon" VARCHAR(50) NOT NULL DEFAULT 'Activity',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resourceId" UUID NOT NULL,
    "details" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedWebsite" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "generationPrompt" JSONB,
    "aiResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteVersion" (
    "id" UUID NOT NULL,
    "websiteId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeSummary" VARCHAR(500),
    "isAutoSave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "generationPrompt" JSONB,
    "aiResponse" JSONB,
    "seoData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageVersion" (
    "id" UUID NOT NULL,
    "landingPageId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeSummary" VARCHAR(500),
    "isAutoSave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingPageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageTemplate" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "category" VARCHAR(100) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "content" JSONB NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingPageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFolder" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "folderId" UUID,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "contentType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "body" JSONB,
    "htmlBody" TEXT,
    "plainBody" TEXT,
    "contentMetadata" JSONB,
    "seoData" JSONB,
    "promptData" JSONB,
    "generationSettings" JSONB,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "body" JSONB,
    "htmlBody" TEXT,
    "plainBody" TEXT,
    "contentMetadata" JSONB,
    "changeSummary" VARCHAR(500),
    "isAutoSave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTemplate" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "contentType" VARCHAR(50) NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'general',
    "body" JSONB NOT NULL,
    "systemPrompt" TEXT,
    "generationSettings" JSONB,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTag" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItemTag" (
    "contentItemId" UUID NOT NULL,
    "contentTagId" UUID NOT NULL,

    CONSTRAINT "ContentItemTag_pkey" PRIMARY KEY ("contentItemId","contentTagId")
);

-- CreateTable
CREATE TABLE "ContentExport" (
    "id" UUID NOT NULL,
    "contentId" UUID NOT NULL,
    "format" VARCHAR(20) NOT NULL,
    "fileUrl" VARCHAR(500),
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEODomain" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "contentScore" INTEGER NOT NULL DEFAULT 0,
    "lastAuditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEODomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOAudit" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "contentScore" INTEGER NOT NULL DEFAULT 0,
    "onPageScore" INTEGER NOT NULL DEFAULT 0,
    "offPageScore" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "recommendations" JSONB,
    "metrics" JSONB,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOAuditPage" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "statusCode" INTEGER,
    "title" VARCHAR(500),
    "metaDescription" VARCHAR(500),
    "h1" VARCHAR(500),
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "internalLinks" INTEGER NOT NULL DEFAULT 0,
    "externalLinks" INTEGER NOT NULL DEFAULT 0,
    "imagesWithoutAlt" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOAuditPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOKeyword" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "keyword" VARCHAR(255) NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "intent" VARCHAR(50) NOT NULL DEFAULT 'informational',
    "keywordType" VARCHAR(50) NOT NULL DEFAULT 'primary',
    "clusterId" UUID,
    "position" INTEGER,
    "url" VARCHAR(500),
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOKeywordCluster" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "pillarKeyword" VARCHAR(255),
    "keywordCount" INTEGER NOT NULL DEFAULT 0,
    "avgVolume" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOKeywordCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOKeywordRanking" (
    "id" UUID NOT NULL,
    "keywordId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "url" VARCHAR(500),
    "previousPosition" INTEGER,
    "change" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOKeywordRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOSchema" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "schemaType" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "jsonLd" JSONB NOT NULL,
    "url" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOReport" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "reportType" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "summary" JSONB,
    "data" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "issuesCount" INTEGER NOT NULL DEFAULT 0,
    "recommendationsCount" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SEOReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEORecommendation" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "impact" VARCHAR(200),
    "effort" VARCHAR(200),
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "url" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SEORecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOCompetitor" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "competitorUrl" VARCHAR(500) NOT NULL,
    "competitorName" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOHistory" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOInternalLink" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "sourceUrl" VARCHAR(500) NOT NULL,
    "targetUrl" VARCHAR(500) NOT NULL,
    "anchorText" VARCHAR(255),
    "suggestionType" VARCHAR(50) NOT NULL DEFAULT 'related',
    "isImplemented" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOInternalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceAudit" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "accessibilityScore" INTEGER NOT NULL DEFAULT 0,
    "bestPracticesScore" INTEGER NOT NULL DEFAULT 0,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "issues" JSONB,
    "recommendations" JSONB,
    "resources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreWebVitals" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "lcp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lcpStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "inp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inpStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "cls" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clsStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "fcp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fcpStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "ttfb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ttfbStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "speedIndex" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedIndexStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "tbt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tbtStatus" VARCHAR(20) NOT NULL DEFAULT 'none',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreWebVitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceRecommendation" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "title" VARCHAR(500) NOT NULL,
    "problem" TEXT,
    "impact" VARCHAR(200),
    "estimatedImprovement" VARCHAR(200),
    "implementationGuide" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationHistory" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "scoreBefore" INTEGER,
    "scoreAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReport" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "summary" JSONB,
    "data" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageAudit" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "originalSize" INTEGER NOT NULL DEFAULT 0,
    "optimizedSize" INTEGER,
    "format" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "recommendedFormat" VARCHAR(20),
    "width" INTEGER,
    "height" INTEGER,
    "hasLazyLoading" BOOLEAN NOT NULL DEFAULT false,
    "hasAltText" BOOLEAN NOT NULL DEFAULT false,
    "issues" JSONB,
    "savingsBytes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAudit" (
    "id" UUID NOT NULL,
    "auditId" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "assetType" VARCHAR(50) NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "gzippedSize" INTEGER,
    "isMinified" BOOLEAN NOT NULL DEFAULT false,
    "isRenderBlocking" BOOLEAN NOT NULL DEFAULT false,
    "isUnused" BOOLEAN NOT NULL DEFAULT false,
    "cacheControl" VARCHAR(200),
    "etag" VARCHAR(200),
    "issues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "previewText" VARCHAR(255),
    "emailType" VARCHAR(50) NOT NULL DEFAULT 'promotional',
    "htmlContent" TEXT,
    "markdownContent" TEXT,
    "plainText" TEXT,
    "jsonContent" JSONB,
    "brand" VARCHAR(255),
    "audience" TEXT,
    "goal" VARCHAR(100),
    "tone" VARCHAR(100),
    "language" VARCHAR(50) NOT NULL DEFAULT 'English',
    "cta" VARCHAR(500),
    "product" VARCHAR(255),
    "keywords" JSONB,
    "templateId" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "openRate" DOUBLE PRECISION,
    "clickRate" DOUBLE PRECISION,
    "unsubscribeRate" DOUBLE PRECISION,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" VARCHAR(50),
    "aiLatencyMs" DOUBLE PRECISION,
    "emailMetadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'business',
    "emailType" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "previewText" VARCHAR(255),
    "htmlContent" TEXT NOT NULL,
    "markdownContent" TEXT,
    "jsonContent" JSONB,
    "variables" JSONB,
    "thumbnailUrl" VARCHAR(500),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailHistory" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "contentBefore" TEXT,
    "contentAfter" TEXT,
    "aiProvider" VARCHAR(50),
    "latencyMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "campaignId" UUID,
    "platform" VARCHAR(50) NOT NULL,
    "postType" VARCHAR(50) NOT NULL DEFAULT 'single',
    "content" TEXT NOT NULL,
    "headline" VARCHAR(500),
    "caption" TEXT,
    "hashtags" JSONB,
    "cta" VARCHAR(500),
    "emojis" JSONB,
    "imageSuggestions" JSONB,
    "imageIds" JSONB,
    "carouselContent" JSONB,
    "storyContent" JSONB,
    "reelScript" TEXT,
    "pollIdeas" JSONB,
    "business" VARCHAR(255),
    "brand" VARCHAR(255),
    "targetAudience" TEXT,
    "goal" VARCHAR(100),
    "tone" VARCHAR(100),
    "keywords" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "scheduledDate" VARCHAR(30),
    "publishedAt" TIMESTAMP(3),
    "performanceScore" DOUBLE PRECISION,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiProvider" VARCHAR(50),
    "aiLatencyMs" DOUBLE PRECISION,
    "socialMetadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialCampaign" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "platforms" JSONB,
    "startDate" VARCHAR(30),
    "endDate" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "targetAudience" TEXT,
    "goals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialCalendar" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "postId" UUID,
    "date" VARCHAR(30) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialHashtag" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "tag" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostHistory" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "contentBefore" TEXT,
    "contentAfter" TEXT,
    "aiProvider" VARCHAR(50),
    "latencyMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "folderId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "imageType" VARCHAR(50) NOT NULL,
    "prompt" TEXT,
    "negativePrompt" TEXT,
    "style" VARCHAR(100),
    "url" VARCHAR(500),
    "thumbnailUrl" VARCHAR(500),
    "localPath" VARCHAR(500),
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "format" VARCHAR(20) NOT NULL DEFAULT 'png',
    "mimeType" VARCHAR(50),
    "imageMetadata" JSONB,
    "generationParams" JSONB,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageFolder" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "parentId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageHistory" (
    "id" UUID NOT NULL,
    "imageId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "params" JSONB,
    "resultUrl" VARCHAR(500),
    "resultLocalPath" VARCHAR(500),
    "provider" VARCHAR(50),
    "latencyMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "tagline" VARCHAR(500),
    "industry" VARCHAR(255),
    "description" TEXT,
    "targetAudience" TEXT,
    "brandPersonality" TEXT,
    "toneOfVoice" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "values" JSONB,
    "primaryColor" VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    "secondaryColor" VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    "accentColor" VARCHAR(7) NOT NULL DEFAULT '#818CF8',
    "typography" VARCHAR(255),
    "logoStyle" VARCHAR(255),
    "iconStyle" VARCHAR(255),
    "brandSummary" TEXT,
    "taglineSuggestions" JSONB,
    "brandVoice" TEXT,
    "elevatorPitch" TEXT,
    "usp" TEXT,
    "colorPalette" JSONB,
    "fontPairings" JSONB,
    "iconSuggestions" JSONB,
    "brandKeywords" JSONB,
    "brandGuidelines" TEXT,
    "aiData" JSONB,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandVersion" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "changeSummary" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandAsset" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "assetType" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500),
    "data" JSONB,
    "assetMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "healthStatus" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "credentials" JSONB NOT NULL,
    "maskedCredentials" JSONB,
    "config" JSONB,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" VARCHAR(50),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "message" TEXT,
    "details" JSONB,
    "durationMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "syncType" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "durationMs" DOUBLE PRECISION,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedItem" (
    "id" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "itemType" VARCHAR(50) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT,
    "url" VARCHAR(500),
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsTimeseries" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "visitors" INTEGER NOT NULL,
    "pageviews" INTEGER NOT NULL,
    "bounceRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDuration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AnalyticsTimeseries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsPage" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "pageviews" INTEGER NOT NULL,
    "uniqueVisitors" INTEGER NOT NULL,
    "bounceRate" DOUBLE PRECISION NOT NULL,
    "avgTime" DOUBLE PRECISION NOT NULL,
    "snapshotDate" DATE NOT NULL,

    CONSTRAINT "AnalyticsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsTrafficSource" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "snapshotDate" DATE NOT NULL,

    CONSTRAINT "AnalyticsTrafficSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDevice" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "snapshotDate" DATE NOT NULL,

    CONSTRAINT "AnalyticsDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsCountry" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "snapshotDate" DATE NOT NULL,

    CONSTRAINT "AnalyticsCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE INDEX "Membership_deletedAt_idx" ON "Membership"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Workspace_organizationId_idx" ON "Workspace"("organizationId");

-- CreateIndex
CREATE INDEX "Workspace_deletedAt_idx" ON "Workspace"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_organizationId_slug_key" ON "Workspace"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_slug_key" ON "Project"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_lastActiveAt_idx" ON "Session"("lastActiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "GeneratedWebsite_projectId_idx" ON "GeneratedWebsite"("projectId");

-- CreateIndex
CREATE INDEX "GeneratedWebsite_status_idx" ON "GeneratedWebsite"("status");

-- CreateIndex
CREATE INDEX "GeneratedWebsite_deletedAt_idx" ON "GeneratedWebsite"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedWebsite_projectId_slug_key" ON "GeneratedWebsite"("projectId", "slug");

-- CreateIndex
CREATE INDEX "WebsiteVersion_websiteId_idx" ON "WebsiteVersion"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteVersion_createdAt_idx" ON "WebsiteVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteVersion_websiteId_versionNumber_key" ON "WebsiteVersion"("websiteId", "versionNumber");

-- CreateIndex
CREATE INDEX "LandingPage_projectId_idx" ON "LandingPage"("projectId");

-- CreateIndex
CREATE INDEX "LandingPage_status_idx" ON "LandingPage"("status");

-- CreateIndex
CREATE INDEX "LandingPage_deletedAt_idx" ON "LandingPage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_projectId_slug_key" ON "LandingPage"("projectId", "slug");

-- CreateIndex
CREATE INDEX "LandingPageVersion_landingPageId_idx" ON "LandingPageVersion"("landingPageId");

-- CreateIndex
CREATE INDEX "LandingPageVersion_createdAt_idx" ON "LandingPageVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageVersion_landingPageId_versionNumber_key" ON "LandingPageVersion"("landingPageId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageTemplate_slug_key" ON "LandingPageTemplate"("slug");

-- CreateIndex
CREATE INDEX "ContentFolder_workspaceId_idx" ON "ContentFolder"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentFolder_parentId_idx" ON "ContentFolder"("parentId");

-- CreateIndex
CREATE INDEX "ContentItem_workspaceId_idx" ON "ContentItem"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentItem_contentType_idx" ON "ContentItem"("contentType");

-- CreateIndex
CREATE INDEX "ContentItem_status_idx" ON "ContentItem"("status");

-- CreateIndex
CREATE INDEX "ContentItem_folderId_idx" ON "ContentItem"("folderId");

-- CreateIndex
CREATE INDEX "ContentItem_deletedAt_idx" ON "ContentItem"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentVersion_contentId_idx" ON "ContentVersion"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_versionNumber_key" ON "ContentVersion"("contentId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContentTemplate_workspaceId_idx" ON "ContentTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "ContentTemplate_contentType_idx" ON "ContentTemplate"("contentType");

-- CreateIndex
CREATE INDEX "ContentTag_workspaceId_idx" ON "ContentTag"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTag_workspaceId_name_key" ON "ContentTag"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "ContentExport_contentId_idx" ON "ContentExport"("contentId");

-- CreateIndex
CREATE INDEX "SEODomain_workspaceId_idx" ON "SEODomain"("workspaceId");

-- CreateIndex
CREATE INDEX "SEOAudit_domainId_idx" ON "SEOAudit"("domainId");

-- CreateIndex
CREATE INDEX "SEOAudit_createdAt_idx" ON "SEOAudit"("createdAt");

-- CreateIndex
CREATE INDEX "SEOAuditPage_auditId_idx" ON "SEOAuditPage"("auditId");

-- CreateIndex
CREATE INDEX "SEOKeyword_domainId_idx" ON "SEOKeyword"("domainId");

-- CreateIndex
CREATE INDEX "SEOKeyword_clusterId_idx" ON "SEOKeyword"("clusterId");

-- CreateIndex
CREATE INDEX "SEOKeyword_keyword_idx" ON "SEOKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SEOKeywordCluster_domainId_idx" ON "SEOKeywordCluster"("domainId");

-- CreateIndex
CREATE INDEX "SEOKeywordRanking_keywordId_idx" ON "SEOKeywordRanking"("keywordId");

-- CreateIndex
CREATE INDEX "SEOKeywordRanking_checkedAt_idx" ON "SEOKeywordRanking"("checkedAt");

-- CreateIndex
CREATE INDEX "SEOSchema_domainId_idx" ON "SEOSchema"("domainId");

-- CreateIndex
CREATE INDEX "SEOReport_domainId_idx" ON "SEOReport"("domainId");

-- CreateIndex
CREATE INDEX "SEOReport_createdAt_idx" ON "SEOReport"("createdAt");

-- CreateIndex
CREATE INDEX "SEORecommendation_domainId_idx" ON "SEORecommendation"("domainId");

-- CreateIndex
CREATE INDEX "SEORecommendation_status_idx" ON "SEORecommendation"("status");

-- CreateIndex
CREATE INDEX "SEORecommendation_priority_idx" ON "SEORecommendation"("priority");

-- CreateIndex
CREATE INDEX "SEOCompetitor_domainId_idx" ON "SEOCompetitor"("domainId");

-- CreateIndex
CREATE INDEX "SEOHistory_domainId_idx" ON "SEOHistory"("domainId");

-- CreateIndex
CREATE INDEX "SEOHistory_createdAt_idx" ON "SEOHistory"("createdAt");

-- CreateIndex
CREATE INDEX "SEOInternalLink_domainId_idx" ON "SEOInternalLink"("domainId");

-- CreateIndex
CREATE INDEX "PerformanceAudit_projectId_idx" ON "PerformanceAudit"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceAudit_createdAt_idx" ON "PerformanceAudit"("createdAt");

-- CreateIndex
CREATE INDEX "CoreWebVitals_auditId_idx" ON "CoreWebVitals"("auditId");

-- CreateIndex
CREATE INDEX "PerformanceRecommendation_auditId_idx" ON "PerformanceRecommendation"("auditId");

-- CreateIndex
CREATE INDEX "PerformanceRecommendation_status_idx" ON "PerformanceRecommendation"("status");

-- CreateIndex
CREATE INDEX "PerformanceRecommendation_priority_idx" ON "PerformanceRecommendation"("priority");

-- CreateIndex
CREATE INDEX "OptimizationHistory_projectId_idx" ON "OptimizationHistory"("projectId");

-- CreateIndex
CREATE INDEX "OptimizationHistory_createdAt_idx" ON "OptimizationHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PerformanceReport_projectId_idx" ON "PerformanceReport"("projectId");

-- CreateIndex
CREATE INDEX "PerformanceReport_createdAt_idx" ON "PerformanceReport"("createdAt");

-- CreateIndex
CREATE INDEX "ImageAudit_auditId_idx" ON "ImageAudit"("auditId");

-- CreateIndex
CREATE INDEX "AssetAudit_auditId_idx" ON "AssetAudit"("auditId");

-- CreateIndex
CREATE INDEX "EmailCampaign_workspaceId_idx" ON "EmailCampaign"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailCampaign_emailType_idx" ON "EmailCampaign"("emailType");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailTemplate_workspaceId_idx" ON "EmailTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailTemplate_emailType_idx" ON "EmailTemplate"("emailType");

-- CreateIndex
CREATE INDEX "EmailHistory_campaignId_idx" ON "EmailHistory"("campaignId");

-- CreateIndex
CREATE INDEX "EmailHistory_createdAt_idx" ON "EmailHistory"("createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_workspaceId_idx" ON "SocialPost"("workspaceId");

-- CreateIndex
CREATE INDEX "SocialPost_campaignId_idx" ON "SocialPost"("campaignId");

-- CreateIndex
CREATE INDEX "SocialPost_platform_idx" ON "SocialPost"("platform");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialCampaign_workspaceId_idx" ON "SocialCampaign"("workspaceId");

-- CreateIndex
CREATE INDEX "SocialCalendar_workspaceId_idx" ON "SocialCalendar"("workspaceId");

-- CreateIndex
CREATE INDEX "SocialCalendar_date_idx" ON "SocialCalendar"("date");

-- CreateIndex
CREATE INDEX "SocialHashtag_workspaceId_idx" ON "SocialHashtag"("workspaceId");

-- CreateIndex
CREATE INDEX "SocialHashtag_tag_idx" ON "SocialHashtag"("tag");

-- CreateIndex
CREATE INDEX "SocialPostHistory_postId_idx" ON "SocialPostHistory"("postId");

-- CreateIndex
CREATE INDEX "SocialPostHistory_createdAt_idx" ON "SocialPostHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Image_workspaceId_idx" ON "Image"("workspaceId");

-- CreateIndex
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");

-- CreateIndex
CREATE INDEX "Image_imageType_idx" ON "Image"("imageType");

-- CreateIndex
CREATE INDEX "ImageFolder_workspaceId_idx" ON "ImageFolder"("workspaceId");

-- CreateIndex
CREATE INDEX "ImageFolder_parentId_idx" ON "ImageFolder"("parentId");

-- CreateIndex
CREATE INDEX "ImageHistory_imageId_idx" ON "ImageHistory"("imageId");

-- CreateIndex
CREATE INDEX "Brand_workspaceId_idx" ON "Brand"("workspaceId");

-- CreateIndex
CREATE INDEX "Brand_deletedAt_idx" ON "Brand"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_workspaceId_slug_key" ON "Brand"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "BrandVersion_brandId_idx" ON "BrandVersion"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandVersion_brandId_versionNumber_key" ON "BrandVersion"("brandId", "versionNumber");

-- CreateIndex
CREATE INDEX "BrandAsset_brandId_idx" ON "BrandAsset"("brandId");

-- CreateIndex
CREATE INDEX "Integration_workspaceId_idx" ON "Integration"("workspaceId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "Integration"("status");

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationId_idx" ON "IntegrationLog"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_integrationId_idx" ON "SyncJob"("integrationId");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");

-- CreateIndex
CREATE INDEX "SyncedItem_integrationId_idx" ON "SyncedItem"("integrationId");

-- CreateIndex
CREATE INDEX "SyncedItem_itemType_idx" ON "SyncedItem"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedItem_integrationId_externalId_key" ON "SyncedItem"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "AnalyticsTimeseries_workspaceId_idx" ON "AnalyticsTimeseries"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsTimeseries_workspaceId_date_key" ON "AnalyticsTimeseries"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "AnalyticsPage_workspaceId_idx" ON "AnalyticsPage"("workspaceId");

-- CreateIndex
CREATE INDEX "AnalyticsPage_snapshotDate_idx" ON "AnalyticsPage"("snapshotDate");

-- CreateIndex
CREATE INDEX "AnalyticsTrafficSource_workspaceId_idx" ON "AnalyticsTrafficSource"("workspaceId");

-- CreateIndex
CREATE INDEX "AnalyticsTrafficSource_snapshotDate_idx" ON "AnalyticsTrafficSource"("snapshotDate");

-- CreateIndex
CREATE INDEX "AnalyticsDevice_workspaceId_idx" ON "AnalyticsDevice"("workspaceId");

-- CreateIndex
CREATE INDEX "AnalyticsDevice_snapshotDate_idx" ON "AnalyticsDevice"("snapshotDate");

-- CreateIndex
CREATE INDEX "AnalyticsCountry_workspaceId_idx" ON "AnalyticsCountry"("workspaceId");

-- CreateIndex
CREATE INDEX "AnalyticsCountry_snapshotDate_idx" ON "AnalyticsCountry"("snapshotDate");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedWebsite" ADD CONSTRAINT "GeneratedWebsite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteVersion" ADD CONSTRAINT "WebsiteVersion_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "GeneratedWebsite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPageVersion" ADD CONSTRAINT "LandingPageVersion_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFolder" ADD CONSTRAINT "ContentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ContentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ContentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemTag" ADD CONSTRAINT "ContentItemTag_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItemTag" ADD CONSTRAINT "ContentItemTag_contentTagId_fkey" FOREIGN KEY ("contentTagId") REFERENCES "ContentTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOAudit" ADD CONSTRAINT "SEOAudit_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOAuditPage" ADD CONSTRAINT "SEOAuditPage_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SEOAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOKeyword" ADD CONSTRAINT "SEOKeyword_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOKeyword" ADD CONSTRAINT "SEOKeyword_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "SEOKeywordCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOKeywordCluster" ADD CONSTRAINT "SEOKeywordCluster_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOKeywordRanking" ADD CONSTRAINT "SEOKeywordRanking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "SEOKeyword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOSchema" ADD CONSTRAINT "SEOSchema_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOReport" ADD CONSTRAINT "SEOReport_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEORecommendation" ADD CONSTRAINT "SEORecommendation_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOCompetitor" ADD CONSTRAINT "SEOCompetitor_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOHistory" ADD CONSTRAINT "SEOHistory_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOInternalLink" ADD CONSTRAINT "SEOInternalLink_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SEODomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreWebVitals" ADD CONSTRAINT "CoreWebVitals_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "PerformanceAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceRecommendation" ADD CONSTRAINT "PerformanceRecommendation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "PerformanceAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailHistory" ADD CONSTRAINT "EmailHistory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SocialCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostHistory" ADD CONSTRAINT "SocialPostHistory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ImageFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageFolder" ADD CONSTRAINT "ImageFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ImageFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageHistory" ADD CONSTRAINT "ImageHistory_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVersion" ADD CONSTRAINT "BrandVersion_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandAsset" ADD CONSTRAINT "BrandAsset_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedItem" ADD CONSTRAINT "SyncedItem_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
