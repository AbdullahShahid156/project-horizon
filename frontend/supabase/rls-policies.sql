-- ============================================================
-- Supabase Row Level Security (RLS) Policies
-- Phase 16A.8 - RLS Strategy (ready for Phase 16B auth)
-- Run AFTER Supabase Auth is configured
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = id::uuid);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid() = id::uuid);

-- ============================================================
-- ORGANIZATIONS TABLE
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Org members can read their organizations
CREATE POLICY "Org members read" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = organizations.id
      AND memberships.user_id = auth.uid()::text
      AND memberships.deleted_at IS NULL
    )
  );

-- Org owners can update
CREATE POLICY "Org owners update" ON organizations
  FOR UPDATE USING (owner_id = auth.uid()::text);

-- Authenticated users can create orgs
CREATE POLICY "Authenticated create org" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Org owners can delete
CREATE POLICY "Org owners delete" ON organizations
  FOR DELETE USING (owner_id = auth.uid()::text);

-- ============================================================
-- MEMBERSHIPS TABLE
-- ============================================================

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Org members can read other members in same org
CREATE POLICY "Members read same org" ON memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

-- Org admins can manage members
CREATE POLICY "Org admins manage members" ON memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- WORKSPACES TABLE
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Org members can read workspaces
CREATE POLICY "Org members read workspaces" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = workspaces.organization_id
      AND memberships.user_id = auth.uid()::text
      AND memberships.deleted_at IS NULL
    )
  );

-- Org members can create/update workspaces
CREATE POLICY "Org members manage workspaces" ON workspaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = workspaces.organization_id
      AND memberships.user_id = auth.uid()::text
      AND memberships.role IN ('owner', 'admin', 'member')
      AND memberships.deleted_at IS NULL
    )
  );

-- ============================================================
-- PROJECTS TABLE
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Workspace members can read projects
CREATE POLICY "Workspace members read projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE w.id = projects.workspace_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

-- Workspace members can manage projects
CREATE POLICY "Workspace members manage projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE w.id = projects.workspace_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin', 'member')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- GENERATED WEBSITES TABLE
-- ============================================================

ALTER TABLE generated_websites ENABLE ROW LEVEL SECURITY;

-- Project members can read websites
CREATE POLICY "Project members read websites" ON generated_websites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE p.id = generated_websites.project_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

-- Project members can manage websites
CREATE POLICY "Project members manage websites" ON generated_websites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE p.id = generated_websites.project_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin', 'member')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- WEBSITE VERSIONS TABLE
-- ============================================================

ALTER TABLE website_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Website members read versions" ON website_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_websites gw
      JOIN projects p ON p.id = gw.project_id
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE gw.id = website_versions.website_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

CREATE POLICY "Website members manage versions" ON website_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM generated_websites gw
      JOIN projects p ON p.id = gw.project_id
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE gw.id = website_versions.website_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin', 'member')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- LANDING PAGES TABLE
-- ============================================================

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read landing pages" ON landing_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE p.id = landing_pages.project_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

CREATE POLICY "Project members manage landing pages" ON landing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE p.id = landing_pages.project_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin', 'member')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- LANDING PAGE VERSIONS TABLE
-- ============================================================

ALTER TABLE landing_page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landing page members read versions" ON landing_page_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp
      JOIN projects p ON p.id = lp.project_id
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE lp.id = landing_page_versions.landing_page_id
      AND m.user_id = auth.uid()::text
      AND m.deleted_at IS NULL
    )
  );

CREATE POLICY "Landing page members manage versions" ON landing_page_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp
      JOIN projects p ON p.id = lp.project_id
      JOIN workspaces w ON w.id = p.workspace_id
      JOIN memberships m ON m.organization_id = w.organization_id
      WHERE lp.id = landing_page_versions.landing_page_id
      AND m.user_id = auth.uid()::text
      AND m.role IN ('owner', 'admin', 'member')
      AND m.deleted_at IS NULL
    )
  );

-- ============================================================
-- CONTENT ITEMS TABLE
-- ============================================================

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read content" ON content_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = (
        SELECT w.organization_id FROM workspaces w
        WHERE w.id = content_items.workspace_id
      )
      AND memberships.user_id = auth.uid()::text
      AND memberships.deleted_at IS NULL
    )
  );

CREATE POLICY "Workspace members manage content" ON content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = (
        SELECT w.organization_id FROM workspaces w
        WHERE w.id = content_items.workspace_id
      )
      AND memberships.user_id = auth.uid()::text
      AND memberships.role IN ('owner', 'admin', 'member')
      AND memberships.deleted_at IS NULL
    )
  );

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

-- ============================================================
-- ACTIVITY LOG TABLE
-- ============================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read activity" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = activity_logs.organization_id
      AND memberships.user_id = auth.uid()::text
      AND memberships.deleted_at IS NULL
    )
  );

-- ============================================================
-- SETTINGS TABLE
-- ============================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings" ON settings
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users update own settings" ON settings
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users insert own settings" ON settings
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- ============================================================
-- SESSIONS TABLE
-- ============================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON sessions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users manage own sessions" ON sessions
  FOR ALL USING (user_id = auth.uid()::text);

-- ============================================================
-- AUDIT LOG TABLE (Admin read only)
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = audit_logs.organization_id
      AND memberships.user_id = auth.uid()::text
      AND memberships.role IN ('owner', 'admin')
      AND memberships.deleted_at IS NULL
    )
  );

-- ============================================================
-- ENABLE RLS FOR REMAINING TABLES
-- (Apply similar policies per domain as needed)
-- ============================================================

ALTER TABLE content_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_exports ENABLE ROW LEVEL SECURITY;

ALTER TABLE seo_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_internal_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE performance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audits ENABLE ROW LEVEL SECURITY;

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE analytics_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_countries ENABLE ROW LEVEL SECURITY;

ALTER TABLE landing_page_templates ENABLE ROW LEVEL SECURITY;
