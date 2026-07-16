$base = "http://localhost:8000/api/v1"
$workspaceId = "dev-workspace"
$defaultProjectId = "default-project"

$bugs = @()
$testCount = 0
$passCount = 0
$failCount = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus,
        [string]$TestName,
        [string]$Description
    )
    
    $script:testCount++
    try {
        $headers = @{ "Content-Type" = "application/json" }
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            ErrorAction = 'Stop'
        }
        if ($Body) { $params.Body = $Body }
        
        $response = Invoke-WebRequest @params
        $actualStatus = $response.StatusCode
        $responseBody = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($actualStatus -eq $ExpectedStatus) {
            $script:passCount++
            Write-Host "[PASS] $TestName" -ForegroundColor Green
            return $responseBody
        } else {
            $script:failCount++
            $bug = [PSCustomObject]@{
                Test = $TestName
                Endpoint = "$Method $Url"
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Description = $Description
            }
            $script:bugs += $bug
            Write-Host "[FAIL] $TestName - Expected $ExpectedStatus, got $actualStatus" -ForegroundColor Red
            return $responseBody
        }
    } catch {
        $actualStatus = $_.Exception.Response.StatusCode.value__
        if (-not $actualStatus) { $actualStatus = 0 }
        
        if ($actualStatus -eq $ExpectedStatus) {
            $script:passCount++
            Write-Host "[PASS] $TestName (Error as expected)" -ForegroundColor Green
            return $null
        } else {
            $script:failCount++
            $bug = [PSCustomObject]@{
                Test = $TestName
                Endpoint = "$Method $Url"
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Description = $Description
            }
            $script:bugs += $bug
            Write-Host "[FAIL] $TestName - Expected $ExpectedStatus, got $actualStatus" -ForegroundColor Red
            return $null
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  API TEST SUITE - All Modules" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ===== ENGINE =====
Write-Host "`n--- ENGINE ---" -ForegroundColor Yellow
Test-Endpoint "GET" "$base/engine/status" -ExpectedStatus 200 -TestName "Engine Status" -Description "Get engine status"
Test-Endpoint "GET" "$base/engine/providers" -ExpectedStatus 200 -TestName "Engine Providers" -Description "Get available providers"

# ===== USERS =====
Write-Host "`n--- USERS ---" -ForegroundColor Yellow
Test-Endpoint "GET" "$base/users/me" -ExpectedStatus 200 -TestName "Users Me" -Description "Get current user"

# ===== TEMPLATES =====
Write-Host "`n--- TEMPLATES ---" -ForegroundColor Yellow
Test-Endpoint "GET" "$base/templates/" -ExpectedStatus 200 -TestName "Templates List" -Description "List all templates"
Test-Endpoint "GET" "$base/templates/nonexistent-template" -ExpectedStatus 404 -TestName "Template Not Found" -Description "Get nonexistent template"

# ===== PROJECTS =====
Write-Host "`n--- PROJECTS ---" -ForegroundColor Yellow

$projectBody = '{"name":"Test Project","workspace_id":"dev-workspace","description":"QA test project"}'
$project = Test-Endpoint "POST" "$base/projects/" -Body $projectBody -ExpectedStatus 200 -TestName "Project Create (valid)" -Description "Create project with valid data"
$projectId = if ($project) { $project.id } else { "default-project" }

Test-Endpoint "POST" "$base/projects/" -Body '{}' -ExpectedStatus 422 -TestName "Project Create (missing fields)" -Description "Create project with empty body"
Test-Endpoint "POST" "$base/projects/" -Body '{"name":"","workspace_id":""}' -ExpectedStatus 422 -TestName "Project Create (empty values)" -Description "Create project with empty name"

Test-Endpoint "GET" "$base/projects/$projectId" -ExpectedStatus 200 -TestName "Project Read" -Description "Get project by ID"
Test-Endpoint "GET" "$base/projects/nonexistent-id" -ExpectedStatus 404 -TestName "Project Read (not found)" -Description "Get nonexistent project"

$dupProject = Test-Endpoint "POST" "$base/projects/$projectId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Project Duplicate" -Description "Duplicate project"
Test-Endpoint "POST" "$base/projects/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Project Duplicate (not found)" -Description "Duplicate nonexistent project"

# ===== LANDING PAGES =====
Write-Host "`n--- LANDING PAGES ---" -ForegroundColor Yellow

$lpBody = '{"title":"Test Landing Page","project_id":"default-project","workspace_id":"dev-workspace","content":{"sections":[{"type":"hero","heading":"Test"}]}}'
$lp = Test-Endpoint "POST" "$base/landing-pages/" -Body $lpBody -ExpectedStatus 200 -TestName "LP Create (valid)" -Description "Create landing page"
$lpId = if ($lp -and $lp.id) { $lp.id } else { "test-lp-id" }

Test-Endpoint "POST" "$base/landing-pages/" -Body '{}' -ExpectedStatus 422 -TestName "LP Create (missing fields)" -Description "Create LP with empty body"

Test-Endpoint "GET" "$base/landing-pages/project/$defaultProjectId" -ExpectedStatus 200 -TestName "LP List by Project" -Description "List LPs by project"
Test-Endpoint "GET" "$base/landing-pages/nonexistent-id" -ExpectedStatus 404 -TestName "LP Read (not found)" -Description "Get nonexistent LP"

$lpUpdateBody = '{"title":"Updated Landing Page","content":{"sections":[{"type":"hero","heading":"Updated"}]}}'
Test-Endpoint "PUT" "$base/landing-pages/$lpId" -Body $lpUpdateBody -ExpectedStatus 200 -TestName "LP Update" -Description "Update landing page"
Test-Endpoint "PUT" "$base/landing-pages/nonexistent-id" -Body $lpUpdateBody -ExpectedStatus 404 -TestName "LP Update (not found)" -Description "Update nonexistent LP"

Test-Endpoint "POST" "$base/landing-pages/$lpId/auto-save" -Body '{"content":{"test":"data"}}' -ExpectedStatus 200 -TestName "LP Auto-Save" -Description "Auto-save landing page"
Test-Endpoint "POST" "$base/landing-pages/nonexistent-id/auto-save" -Body '{"content":{"test":"data"}}' -ExpectedStatus 404 -TestName "LP Auto-Save (not found)" -Description "Auto-save nonexistent LP"

Test-Endpoint "GET" "$base/landing-pages/$lpId/versions" -ExpectedStatus 200 -TestName "LP Versions List" -Description "List LP versions"
Test-Endpoint "POST" "$base/landing-pages/$lpId/versions" -Body '{}' -ExpectedStatus 200 -TestName "LP Version Create" -Description "Create LP version"
Test-Endpoint "POST" "$base/landing-pages/nonexistent-id/versions" -Body '{}' -ExpectedStatus 404 -TestName "LP Version Create (not found)" -Description "Create version for nonexistent LP"

Test-Endpoint "POST" "$base/landing-pages/$lpId/restore" -Body '{}' -ExpectedStatus 200 -TestName "LP Restore" -Description "Restore landing page"

Test-Endpoint "POST" "$base/landing-pages/improve-copy" -Body '{"content":"Original copy text to improve"}' -ExpectedStatus 200 -TestName "LP Improve Copy" -Description "Improve copy"
Test-Endpoint "POST" "$base/landing-pages/improve-copy" -Body '{}' -ExpectedStatus 422 -TestName "LP Improve Copy (missing content)" -Description "Improve copy without content"

# LP Generate
$lpGenBody = '{"project_id":"default-project","workspace_id":"dev-workspace","business_type":"SaaS","description":"Test landing page generation"}'
$genLp = Test-Endpoint "POST" "$base/landing-pages/generate" -Body $lpGenBody -ExpectedStatus 200 -TestName "LP Generate" -Description "Generate landing page with AI"

Test-Endpoint "DELETE" "$base/landing-pages/$lpId" -ExpectedStatus 200 -TestName "LP Delete" -Description "Delete landing page"
Test-Endpoint "DELETE" "$base/landing-pages/nonexistent-id" -ExpectedStatus 404 -TestName "LP Delete (not found)" -Description "Delete nonexistent LP"

# ===== CONTENT STUDIO =====
Write-Host "`n--- CONTENT STUDIO ---" -ForegroundColor Yellow

$contentBody = '{"title":"Test Content","type":"blog_post","project_id":"default-project","workspace_id":"dev-workspace","content":"Test content body text for the content studio."}'
$content = Test-Endpoint "POST" "$base/content/" -Body $contentBody -ExpectedStatus 200 -TestName "Content Create (valid)" -Description "Create content item"
$contentId = if ($content -and $content.id) { $content.id } else { "test-content-id" }

Test-Endpoint "POST" "$base/content/" -Body '{}' -ExpectedStatus 422 -TestName "Content Create (missing fields)" -Description "Create content with empty body"

Test-Endpoint "GET" "$base/content/" -ExpectedStatus 200 -TestName "Content List" -Description "List all content items"
Test-Endpoint "GET" "$base/content/$contentId" -ExpectedStatus 200 -TestName "Content Read" -Description "Get content by ID"
Test-Endpoint "GET" "$base/content/nonexistent-id" -ExpectedStatus 404 -TestName "Content Read (not found)" -Description "Get nonexistent content"

$contentUpdateBody = '{"title":"Updated Content","content":"Updated content body text."}'
Test-Endpoint "PUT" "$base/content/$contentId" -Body $contentUpdateBody -ExpectedStatus 200 -TestName "Content Update" -Description "Update content item"
Test-Endpoint "PUT" "$base/content/nonexistent-id" -Body $contentUpdateBody -ExpectedStatus 404 -TestName "Content Update (not found)" -Description "Update nonexistent content"

$contentDup = Test-Endpoint "POST" "$base/content/$contentId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Content Duplicate" -Description "Duplicate content"
Test-Endpoint "POST" "$base/content/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Content Duplicate (not found)" -Description "Duplicate nonexistent content"

Test-Endpoint "POST" "$base/content/$contentId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Content Archive" -Description "Archive content"
Test-Endpoint "POST" "$base/content/nonexistent-id/archive" -Body '{}' -ExpectedStatus 404 -TestName "Content Archive (not found)" -Description "Archive nonexistent content"

Test-Endpoint "POST" "$base/content/$contentId/restore" -Body '{}' -ExpectedStatus 200 -TestName "Content Restore" -Description "Restore content"

Test-Endpoint "POST" "$base/content/$contentId/auto-save" -Body '{"content":"Auto-saved content"}' -ExpectedStatus 200 -TestName "Content Auto-Save" -Description "Auto-save content"
Test-Endpoint "POST" "$base/content/nonexistent-id/auto-save" -Body '{"content":"test"}' -ExpectedStatus 404 -TestName "Content Auto-Save (not found)" -Description "Auto-save nonexistent content"

Test-Endpoint "GET" "$base/content/$contentId/versions" -ExpectedStatus 200 -TestName "Content Versions" -Description "List content versions"

$contentGenBody = '{"type":"blog_post","topic":"AI in Marketing","project_id":"default-project","workspace_id":"dev-workspace"}'
Test-Endpoint "POST" "$base/content/generate" -Body $contentGenBody -ExpectedStatus 200 -TestName "Content Generate" -Description "Generate content with AI"

Test-Endpoint "POST" "$base/content/stats" -Body '{"project_id":"default-project","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Content Stats" -Description "Get content stats"

Test-Endpoint "GET" "$base/content/folders" -ExpectedStatus 200 -TestName "Content Folders List" -Description "List content folders"
Test-Endpoint "POST" "$base/content/folders" -Body '{"name":"Test Folder","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Content Folder Create" -Description "Create content folder"

# Cleanup content
Test-Endpoint "DELETE" "$base/content/$contentId" -ExpectedStatus 200 -TestName "Content Delete" -Description "Delete content item"
Test-Endpoint "DELETE" "$base/content/nonexistent-id" -ExpectedStatus 404 -TestName "Content Delete (not found)" -Description "Delete nonexistent content"

# ===== IMAGE STUDIO =====
Write-Host "`n--- IMAGE STUDIO ---" -ForegroundColor Yellow

$imageBody = '{"prompt":"A beautiful sunset over mountains","project_id":"default-project","workspace_id":"dev-workspace","style":"photographic"}'
$image = Test-Endpoint "POST" "$base/images/" -Body $imageBody -ExpectedStatus 200 -TestName "Image Create (valid)" -Description "Create image record"
$imageId = if ($image -and $image.id) { $image.id } else { "test-image-id" }

Test-Endpoint "POST" "$base/images/" -Body '{}' -ExpectedStatus 422 -TestName "Image Create (missing fields)" -Description "Create image with empty body"

Test-Endpoint "GET" "$base/images/" -ExpectedStatus 200 -TestName "Image List" -Description "List all images"
Test-Endpoint "GET" "$base/images/$imageId" -ExpectedStatus 200 -TestName "Image Read" -Description "Get image by ID"
Test-Endpoint "GET" "$base/images/nonexistent-id" -ExpectedStatus 404 -TestName "Image Read (not found)" -Description "Get nonexistent image"

$imageUpdateBody = '{"prompt":"Updated prompt - a beautiful sunset"}'
Test-Endpoint "PUT" "$base/images/$imageId" -Body $imageUpdateBody -ExpectedStatus 200 -TestName "Image Update" -Description "Update image"
Test-Endpoint "PUT" "$base/images/nonexistent-id" -Body $imageUpdateBody -ExpectedStatus 404 -TestName "Image Update (not found)" -Description "Update nonexistent image"

Test-Endpoint "POST" "$base/images/$imageId/favorite" -Body '{}' -ExpectedStatus 200 -TestName "Image Favorite" -Description "Toggle image favorite"
Test-Endpoint "POST" "$base/images/nonexistent-id/favorite" -Body '{}' -ExpectedStatus 404 -TestName "Image Favorite (not found)" -Description "Favorite nonexistent image"

Test-Endpoint "GET" "$base/images/$imageId/history" -ExpectedStatus 200 -TestName "Image History" -Description "Get image history"

Test-Endpoint "POST" "$base/images/stats" -Body '{"project_id":"default-project","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Image Stats" -Description "Get image stats"

Test-Endpoint "GET" "$base/images/folders" -ExpectedStatus 200 -TestName "Image Folders List" -Description "List image folders"
Test-Endpoint "POST" "$base/images/folders" -Body '{"name":"Test Image Folder","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Image Folder Create" -Description "Create image folder"

$imageGenBody = '{"prompt":"A futuristic city skyline","project_id":"default-project","workspace_id":"dev-workspace","style":"digital_art"}'
Test-Endpoint "POST" "$base/images/generate" -Body $imageGenBody -ExpectedStatus 200 -TestName "Image Generate" -Description "Generate image with AI"

Test-Endpoint "POST" "$base/images/ai/enhance-prompt" -Body '{"prompt":"sunset over ocean"}' -ExpectedStatus 200 -TestName "Image AI Enhance Prompt" -Description "Enhance prompt"
Test-Endpoint "POST" "$base/images/ai/enhance-prompt" -Body '{}' -ExpectedStatus 422 -TestName "Image AI Enhance Prompt (missing)" -Description "Enhance prompt without prompt field"

Test-Endpoint "POST" "$base/images/ai/variations" -Body '{"image_id":"test","count":3}' -ExpectedStatus 200 -TestName "Image AI Variations" -Description "Generate variations"

Test-Endpoint "POST" "$base/images/ai/upscale" -Body '{"image_id":"test","scale":2}' -ExpectedStatus 200 -TestName "Image AI Upscale" -Description "Upscale image"

Test-Endpoint "DELETE" "$base/images/$imageId" -ExpectedStatus 200 -TestName "Image Delete" -Description "Delete image"
Test-Endpoint "DELETE" "$base/images/nonexistent-id" -ExpectedStatus 404 -TestName "Image Delete (not found)" -Description "Delete nonexistent image"

# ===== SOCIAL MEDIA STUDIO =====
Write-Host "`n--- SOCIAL MEDIA STUDIO ---" -ForegroundColor Yellow

$socialBody = '{"content":"Test social media post about AI innovation","platform":"twitter","project_id":"default-project","workspace_id":"dev-workspace"}'
$socialPost = Test-Endpoint "POST" "$base/social/posts" -Body $socialBody -ExpectedStatus 200 -TestName "Social Post Create (valid)" -Description "Create social post"
$socialPostId = if ($socialPost -and $socialPost.id) { $socialPost.id } else { "test-social-id" }

Test-Endpoint "POST" "$base/social/posts" -Body '{}' -ExpectedStatus 422 -TestName "Social Post Create (missing)" -Description "Create social post with empty body"

Test-Endpoint "GET" "$base/social/posts" -ExpectedStatus 200 -TestName "Social Posts List" -Description "List social posts"
Test-Endpoint "GET" "$base/social/posts/$socialPostId" -ExpectedStatus 200 -TestName "Social Post Read" -Description "Get social post by ID"
Test-Endpoint "GET" "$base/social/posts/nonexistent-id" -ExpectedStatus 404 -TestName "Social Post Read (not found)" -Description "Get nonexistent social post"

$socialUpdateBody = '{"content":"Updated social media post content","platform":"twitter"}'
Test-Endpoint "PUT" "$base/social/posts/$socialPostId" -Body $socialUpdateBody -ExpectedStatus 200 -TestName "Social Post Update" -Description "Update social post"
Test-Endpoint "PUT" "$base/social/posts/nonexistent-id" -Body $socialUpdateBody -ExpectedStatus 404 -TestName "Social Post Update (not found)" -Description "Update nonexistent social post"

Test-Endpoint "POST" "$base/social/posts/$socialPostId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Social Post Duplicate" -Description "Duplicate social post"
Test-Endpoint "POST" "$base/social/posts/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Social Post Duplicate (not found)" -Description "Duplicate nonexistent social post"

Test-Endpoint "POST" "$base/social/posts/$socialPostId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Social Post Archive" -Description "Archive social post"
Test-Endpoint "POST" "$base/social/posts/nonexistent-id/archive" -Body '{}' -ExpectedStatus 404 -TestName "Social Post Archive (not found)" -Description "Archive nonexistent social post"

Test-Endpoint "POST" "$base/social/posts/stats" -Body '{"project_id":"default-project","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Social Post Stats" -Description "Get social post stats"

$socialGenBody = '{"topic":"AI trends in 2026","platform":"twitter","project_id":"default-project","workspace_id":"dev-workspace"}'
Test-Endpoint "POST" "$base/social/generate" -Body $socialGenBody -ExpectedStatus 200 -TestName "Social Generate" -Description "Generate social post with AI"

Test-Endpoint "GET" "$base/social/campaigns" -ExpectedStatus 200 -TestName "Social Campaigns List" -Description "List social campaigns"
Test-Endpoint "POST" "$base/social/campaigns" -Body '{"name":"Test Campaign","workspace_id":"dev-workspace","project_id":"default-project"}' -ExpectedStatus 200 -TestName "Social Campaign Create" -Description "Create social campaign"

Test-Endpoint "GET" "$base/social/calendar" -ExpectedStatus 200 -TestName "Social Calendar" -Description "Get social calendar"

Test-Endpoint "DELETE" "$base/social/posts/$socialPostId" -ExpectedStatus 200 -TestName "Social Post Delete" -Description "Delete social post"
Test-Endpoint "DELETE" "$base/social/posts/nonexistent-id" -ExpectedStatus 404 -TestName "Social Post Delete (not found)" -Description "Delete nonexistent social post"

# ===== EMAIL STUDIO =====
Write-Host "`n--- EMAIL STUDIO ---" -ForegroundColor Yellow

$emailCampaignBody = '{"name":"Test Email Campaign","subject":"Test Subject","workspace_id":"dev-workspace","project_id":"default-project"}'
$emailCampaign = Test-Endpoint "POST" "$base/email/campaigns" -Body $emailCampaignBody -ExpectedStatus 200 -TestName "Email Campaign Create (valid)" -Description "Create email campaign"
$emailCampaignId = if ($emailCampaign -and $emailCampaign.id) { $emailCampaign.id } else { "test-email-campaign-id" }

Test-Endpoint "POST" "$base/email/campaigns" -Body '{}' -ExpectedStatus 422 -TestName "Email Campaign Create (missing)" -Description "Create email campaign with empty body"

Test-Endpoint "GET" "$base/email/campaigns" -ExpectedStatus 200 -TestName "Email Campaigns List" -Description "List email campaigns"
Test-Endpoint "GET" "$base/email/campaigns/$emailCampaignId" -ExpectedStatus 200 -TestName "Email Campaign Read" -Description "Get email campaign by ID"
Test-Endpoint "GET" "$base/email/campaigns/nonexistent-id" -ExpectedStatus 404 -TestName "Email Campaign Read (not found)" -Description "Get nonexistent email campaign"

$emailUpdateBody = '{"name":"Updated Campaign","subject":"Updated Subject"}'
Test-Endpoint "PUT" "$base/email/campaigns/$emailCampaignId" -Body $emailUpdateBody -ExpectedStatus 200 -TestName "Email Campaign Update" -Description "Update email campaign"
Test-Endpoint "PUT" "$base/email/campaigns/nonexistent-id" -Body $emailUpdateBody -ExpectedStatus 404 -TestName "Email Campaign Update (not found)" -Description "Update nonexistent email campaign"

Test-Endpoint "POST" "$base/email/campaigns/$emailCampaignId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Email Campaign Duplicate" -Description "Duplicate email campaign"
Test-Endpoint "POST" "$base/email/campaigns/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Email Campaign Duplicate (not found)" -Description "Duplicate nonexistent email campaign"

Test-Endpoint "GET" "$base/email/campaigns/stats" -ExpectedStatus 200 -TestName "Email Campaigns Stats" -Description "Get email campaigns stats"

$emailGenBody = '{"topic":"Welcome new users","type":"welcome","project_id":"default-project","workspace_id":"dev-workspace"}'
Test-Endpoint "POST" "$base/email/generate" -Body $emailGenBody -ExpectedStatus 200 -TestName "Email Generate" -Description "Generate email with AI"

Test-Endpoint "GET" "$base/email/templates" -ExpectedStatus 200 -TestName "Email Templates List" -Description "List email templates"

$emailTemplateBody = '{"name":"Test Template","subject":"Template Subject","body":"<p>Template body</p>","workspace_id":"dev-workspace"}'
$emailTemplate = Test-Endpoint "POST" "$base/email/templates" -Body $emailTemplateBody -ExpectedStatus 200 -TestName "Email Template Create" -Description "Create email template"
$emailTemplateId = if ($emailTemplate -and $emailTemplate.id) { $emailTemplate.id } else { "test-template-id" }

Test-Endpoint "GET" "$base/email/templates/$emailTemplateId" -ExpectedStatus 200 -TestName "Email Template Read" -Description "Get email template by ID"
Test-Endpoint "GET" "$base/email/templates/nonexistent-id" -ExpectedStatus 404 -TestName "Email Template Read (not found)" -Description "Get nonexistent email template"

Test-Endpoint "POST" "$base/email/templates/$emailTemplateId/use" -Body '{}' -ExpectedStatus 200 -TestName "Email Template Use" -Description "Use email template"
Test-Endpoint "POST" "$base/email/templates/nonexistent-id/use" -Body '{}' -ExpectedStatus 404 -TestName "Email Template Use (not found)" -Description "Use nonexistent email template"

Test-Endpoint "DELETE" "$base/email/campaigns/$emailCampaignId" -ExpectedStatus 200 -TestName "Email Campaign Delete" -Description "Delete email campaign"
Test-Endpoint "DELETE" "$base/email/campaigns/nonexistent-id" -ExpectedStatus 404 -TestName "Email Campaign Delete (not found)" -Description "Delete nonexistent email campaign"

# ===== BRAND STUDIO =====
Write-Host "`n--- BRAND STUDIO ---" -ForegroundColor Yellow

$brandBody = '{"name":"Test Brand","primary_color":"#FF0000","workspace_id":"dev-workspace","project_id":"default-project","description":"Test brand for QA"}'
$brand = Test-Endpoint "POST" "$base/brands/" -Body $brandBody -ExpectedStatus 200 -TestName "Brand Create (valid)" -Description "Create brand"
$brandId = if ($brand -and $brand.id) { $brand.id } else { "test-brand-id" }

Test-Endpoint "POST" "$base/brands/" -Body '{}' -ExpectedStatus 422 -TestName "Brand Create (missing)" -Description "Create brand with empty body"

Test-Endpoint "GET" "$base/brands/" -ExpectedStatus 200 -TestName "Brand List" -Description "List all brands"
Test-Endpoint "GET" "$base/brands/$brandId" -ExpectedStatus 200 -TestName "Brand Read" -Description "Get brand by ID"
Test-Endpoint "GET" "$base/brands/nonexistent-id" -ExpectedStatus 404 -TestName "Brand Read (not found)" -Description "Get nonexistent brand"

$brandUpdateBody = '{"name":"Updated Brand","primary_color":"#00FF00"}'
Test-Endpoint "PUT" "$base/brands/$brandId" -Body $brandUpdateBody -ExpectedStatus 200 -TestName "Brand Update" -Description "Update brand"
Test-Endpoint "PUT" "$base/brands/nonexistent-id" -Body $brandUpdateBody -ExpectedStatus 404 -TestName "Brand Update (not found)" -Description "Update nonexistent brand"

Test-Endpoint "POST" "$base/brands/$brandId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Brand Duplicate" -Description "Duplicate brand"
Test-Endpoint "POST" "$base/brands/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Brand Duplicate (not found)" -Description "Duplicate nonexistent brand"

Test-Endpoint "POST" "$base/brands/$brandId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Brand Archive" -Description "Archive brand"
Test-Endpoint "POST" "$base/brands/nonexistent-id/archive" -Body '{}' -ExpectedStatus 404 -TestName "Brand Archive (not found)" -Description "Archive nonexistent brand"

Test-Endpoint "POST" "$base/brands/$brandId/restore" -Body '{}' -ExpectedStatus 200 -TestName "Brand Restore" -Description "Restore brand"

Test-Endpoint "POST" "$base/brands/$brandId/favorite" -Body '{}' -ExpectedStatus 200 -TestName "Brand Favorite" -Description "Toggle brand favorite"
Test-Endpoint "POST" "$base/brands/nonexistent-id/favorite" -Body '{}' -ExpectedStatus 404 -TestName "Brand Favorite (not found)" -Description "Favorite nonexistent brand"

Test-Endpoint "GET" "$base/brands/$brandId/versions" -ExpectedStatus 200 -TestName "Brand Versions" -Description "List brand versions"

$brandGenBody = '{"name":"AI Generated Brand","description":"A modern tech brand","workspace_id":"dev-workspace","project_id":"default-project"}'
Test-Endpoint "POST" "$base/brands/generate" -Body $brandGenBody -ExpectedStatus 200 -TestName "Brand Generate" -Description "Generate brand with AI"

Test-Endpoint "POST" "$base/brands/stats" -Body '{"workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Brand Stats" -Description "Get brand stats"

Test-Endpoint "DELETE" "$base/brands/$brandId" -ExpectedStatus 200 -TestName "Brand Delete" -Description "Delete brand"
Test-Endpoint "DELETE" "$base/brands/nonexistent-id" -ExpectedStatus 404 -TestName "Brand Delete (not found)" -Description "Delete nonexistent brand"

# ===== SEO STUDIO =====
Write-Host "`n--- SEO STUDIO ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/seo/domains" -ExpectedStatus 200 -TestName "SEO Domains" -Description "List SEO domains"
Test-Endpoint "GET" "$base/seo/keywords" -ExpectedStatus 200 -TestName "SEO Keywords" -Description "List SEO keywords"
Test-Endpoint "GET" "$base/seo/audits" -ExpectedStatus 200 -TestName "SEO Audits" -Description "List SEO audits"
Test-Endpoint "GET" "$base/seo/dashboard" -ExpectedStatus 200 -TestName "SEO Dashboard" -Description "Get SEO dashboard"
Test-Endpoint "GET" "$base/seo/technical" -ExpectedStatus 200 -TestName "SEO Technical" -Description "Get SEO technical data"
Test-Endpoint "GET" "$base/seo/recommendations" -ExpectedStatus 200 -TestName "SEO Recommendations" -Description "Get SEO recommendations"
Test-Endpoint "GET" "$base/seo/competitors" -ExpectedStatus 200 -TestName "SEO Competitors" -Description "Get SEO competitors"
Test-Endpoint "GET" "$base/seo/reports" -ExpectedStatus 200 -TestName "SEO Reports" -Description "Get SEO reports"
Test-Endpoint "GET" "$base/seo/schemas" -ExpectedStatus 200 -TestName "SEO Schemas" -Description "Get SEO schemas"
Test-Endpoint "GET" "$base/seo/internal-links" -ExpectedStatus 200 -TestName "SEO Internal Links" -Description "Get SEO internal links"

# ===== PERFORMANCE STUDIO =====
Write-Host "`n--- PERFORMANCE STUDIO ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/performance/dashboard" -ExpectedStatus 200 -TestName "Performance Dashboard" -Description "Get performance dashboard"
Test-Endpoint "GET" "$base/performance/audits" -ExpectedStatus 200 -TestName "Performance Audits" -Description "List performance audits"
Test-Endpoint "GET" "$base/performance/reports" -ExpectedStatus 200 -TestName "Performance Reports" -Description "List performance reports"
Test-Endpoint "GET" "$base/performance/history" -ExpectedStatus 200 -TestName "Performance History" -Description "Get performance history"
Test-Endpoint "GET" "$base/performance/recommendations" -ExpectedStatus 200 -TestName "Performance Recommendations" -Description "Get performance recommendations"

# ===== WEBSITES =====
Write-Host "`n--- WEBSITES ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/websites/project/$defaultProjectId" -ExpectedStatus 200 -TestName "Websites by Project" -Description "List websites by project"
Test-Endpoint "GET" "$base/websites/nonexistent-id" -ExpectedStatus 404 -TestName "Website Read (not found)" -Description "Get nonexistent website"

# ===== SUMMARY =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $testCount"
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($bugs.Count -gt 0) {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  BUGS FOUND ($($bugs.Count))" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    $i = 1
    foreach ($bug in $bugs) {
        Write-Host "`n--- Bug #$i ---" -ForegroundColor Red
        Write-Host "  Test: $($bug.Test)"
        Write-Host "  Endpoint: $($bug.Endpoint)"
        Write-Host "  Expected Status: $($bug.Expected)"
        Write-Host "  Actual Status: $($bug.Actual)"
        Write-Host "  Description: $($bug.Description)"
        $i++
    }
} else {
    Write-Host "`nNo bugs found!" -ForegroundColor Green
}
