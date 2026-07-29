-- ============================================================
-- Supabase Row Level Security (RLS) Policies
-- Phase 16A.8 - RLS Strategy (ready for Phase 16B auth)
-- Run AFTER Supabase Auth is configured
-- ============================================================

-- ============================================================
-- USER TABLE
-- ============================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON "User"
  FOR SELECT USING (auth.uid() = id::uuid);

CREATE POLICY "Users update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id::uuid);

-- ============================================================
-- ORGANIZATION TABLE
-- ============================================================

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read" ON "Organization"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = "Organization".id
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."deletedAt" IS NULL
    )
  );

CREATE POLICY "Org owners update" ON "Organization"
  FOR UPDATE USING ("ownerId" = auth.uid());

CREATE POLICY "Authenticated create org" ON "Organization"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Org owners delete" ON "Organization"
  FOR DELETE USING ("ownerId" = auth.uid());

-- ============================================================
-- MEMBERSHIP TABLE
-- ============================================================

ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read same org" ON "Membership"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "Membership"."organizationId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Org admins manage members" ON "Membership"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Membership" m
      WHERE m."organizationId" = "Membership"."organizationId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- WORKSPACE TABLE
-- ============================================================

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read workspaces" ON "Workspace"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = "Workspace"."organizationId"
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."deletedAt" IS NULL
    )
  );

CREATE POLICY "Org members manage workspaces" ON "Workspace"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = "Workspace"."organizationId"
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."role" IN ('owner', 'admin', 'member')
      AND "Membership"."deletedAt" IS NULL
    )
  );

-- ============================================================
-- PROJECT TABLE
-- ============================================================

ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read projects" ON "Project"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Workspace" w
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE w.id = "Project"."workspaceId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Workspace members manage projects" ON "Project"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Workspace" w
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE w.id = "Project"."workspaceId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'member')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- GENERATED WEBSITE TABLE
-- ============================================================

ALTER TABLE "GeneratedWebsite" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read websites" ON "GeneratedWebsite"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Project" p
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE p.id = "GeneratedWebsite"."projectId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Project members manage websites" ON "GeneratedWebsite"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Project" p
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE p.id = "GeneratedWebsite"."projectId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'member')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- WEBSITE VERSION TABLE
-- ============================================================

ALTER TABLE "WebsiteVersion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Website members read versions" ON "WebsiteVersion"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "GeneratedWebsite" gw
      JOIN "Project" p ON p.id = gw."projectId"
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE gw.id = "WebsiteVersion"."websiteId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Website members manage versions" ON "WebsiteVersion"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "GeneratedWebsite" gw
      JOIN "Project" p ON p.id = gw."projectId"
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE gw.id = "WebsiteVersion"."websiteId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'member')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- LANDING PAGE TABLE
-- ============================================================

ALTER TABLE "LandingPage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read landing pages" ON "LandingPage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Project" p
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE p.id = "LandingPage"."projectId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Project members manage landing pages" ON "LandingPage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Project" p
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE p.id = "LandingPage"."projectId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'member')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- LANDING PAGE VERSION TABLE
-- ============================================================

ALTER TABLE "LandingPageVersion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landing page members read versions" ON "LandingPageVersion"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "LandingPage" lp
      JOIN "Project" p ON p.id = lp."projectId"
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE lp.id = "LandingPageVersion"."landingPageId"
      AND m."userId" = auth.uid()
      AND m."deletedAt" IS NULL
    )
  );

CREATE POLICY "Landing page members manage versions" ON "LandingPageVersion"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "LandingPage" lp
      JOIN "Project" p ON p.id = lp."projectId"
      JOIN "Workspace" w ON w.id = p."workspaceId"
      JOIN "Membership" m ON m."organizationId" = w."organizationId"
      WHERE lp.id = "LandingPageVersion"."landingPageId"
      AND m."userId" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'member')
      AND m."deletedAt" IS NULL
    )
  );

-- ============================================================
-- CONTENT ITEM TABLE
-- ============================================================

ALTER TABLE "ContentItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read content" ON "ContentItem"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = (
        SELECT w."organizationId" FROM "Workspace" w
        WHERE w.id = "ContentItem"."workspaceId"
      )
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."deletedAt" IS NULL
    )
  );

CREATE POLICY "Workspace members manage content" ON "ContentItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = (
        SELECT w."organizationId" FROM "Workspace" w
        WHERE w.id = "ContentItem"."workspaceId"
      )
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."role" IN ('owner', 'admin', 'member')
      AND "Membership"."deletedAt" IS NULL
    )
  );

-- ============================================================
-- NOTIFICATION TABLE
-- ============================================================

ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON "Notification"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users update own notifications" ON "Notification"
  FOR UPDATE USING ("userId" = auth.uid());

-- ============================================================
-- ACTIVITY LOG TABLE
-- ============================================================

ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read activity" ON "ActivityLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = "ActivityLog"."organizationId"
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."deletedAt" IS NULL
    )
  );

-- ============================================================
-- SETTINGS TABLE
-- ============================================================

ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings" ON "Settings"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users update own settings" ON "Settings"
  FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Users insert own settings" ON "Settings"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

-- ============================================================
-- SESSION TABLE
-- ============================================================

ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON "Session"
  FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Users manage own sessions" ON "Session"
  FOR ALL USING ("userId" = auth.uid());

-- ============================================================
-- AUDIT LOG TABLE (Admin read only)
-- ============================================================

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins read audit logs" ON "AuditLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Membership"
      WHERE "Membership"."organizationId" = "AuditLog"."organizationId"
      AND "Membership"."userId" = auth.uid()
      AND "Membership"."role" IN ('owner', 'admin')
      AND "Membership"."deletedAt" IS NULL
    )
  );

-- ============================================================
-- ENABLE RLS FOR ALL REMAINING TABLES
-- ============================================================

ALTER TABLE "LandingPageTemplate" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ContentFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentItemTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentExport" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "SEODomain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOAuditPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOKeyword" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOKeywordCluster" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOKeywordRanking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOSchema" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEORecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOCompetitor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOInternalLink" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "PerformanceAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoreWebVitals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceRecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OptimizationHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImageAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssetAudit" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "EmailCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailHistory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "SocialPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialCalendar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialHashtag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialPostHistory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Image" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImageFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImageHistory" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Brand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandAsset" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncedItem" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AnalyticsTimeseries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsTrafficSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsCountry" ENABLE ROW LEVEL SECURITY;
