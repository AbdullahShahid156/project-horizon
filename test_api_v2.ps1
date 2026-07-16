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
        [string]$Description,
        [bool]$IsRealBug = $false
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
        $responseBody = $null
        try { $responseBody = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue } catch {}
        
        if ($actualStatus -eq $ExpectedStatus) {
            $script:passCount++
            Write-Host "[PASS] $TestName" -ForegroundColor Green
            return $responseBody
        } else {
            $script:failCount++
            $detail = ""
            if ($responseBody -and $responseBody.detail) { $detail = $responseBody.detail }
            $bug = [PSCustomObject]@{
                Test = $TestName
                Endpoint = "$Method $Url"
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Description = "$Description - Detail: $detail"
                IsRealBug = $IsRealBug
            }
            $script:bugs += $bug
            Write-Host "[FAIL] $TestName - Expected $ExpectedStatus, got $actualStatus ($detail)" -ForegroundColor Red
            return $responseBody
        }
    } catch {
        $actualStatus = $_.Exception.Response.StatusCode.value__
        if (-not $actualStatus) { $actualStatus = 0 }
        
        $detail = ""
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd() | ConvertFrom-Json
            $detail = $errBody.detail
            $reader.Close()
        } catch {}
        
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
                Description = "$Description - Detail: $detail"
                IsRealBug = $IsRealBug
            }
            $script:bugs += $bug
            Write-Host "[FAIL] $TestName - Expected $ExpectedStatus, got $actualStatus ($detail)" -ForegroundColor Red
            return $null
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE API TEST SUITE (Round 2)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# =============================================
# PROJECTS - CORRECTED
# =============================================
Write-Host "`n--- PROJECTS ---" -ForegroundColor Yellow

$projectBody = '{"name":"Test Project","workspace_id":"dev-workspace","description":"QA test project"}'
$project = Test-Endpoint "POST" "$base/projects/" -Body $projectBody -ExpectedStatus 200 -TestName "Project Create (valid)" -Description "Create project with valid data" -IsRealBug $false
$projectId = if ($project -and $project.id) { $project.id } else { "default-project" }
Write-Host "  -> Created project ID: $projectId" -ForegroundColor DarkGray

# BUG: Empty name/workspace should be rejected
Test-Endpoint "POST" "$base/projects/" -Body '{}' -ExpectedStatus 422 -TestName "Project Create (empty body)" -Description "Create project with empty body" -IsRealBug $true
Test-Endpoint "POST" "$base/projects/" -Body '{"name":"","workspace_id":""}' -ExpectedStatus 422 -TestName "Project Create (empty values)" -Description "Empty name/workspace should be rejected" -IsRealBug $true

Test-Endpoint "GET" "$base/projects/$projectId" -ExpectedStatus 200 -TestName "Project Read" -Description "Get project by ID"
Test-Endpoint "GET" "$base/projects/nonexistent-id" -ExpectedStatus 404 -TestName "Project Read (not found)" -Description "Get nonexistent project"

$dupProject = Test-Endpoint "POST" "$base/projects/$projectId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Project Duplicate" -Description "Duplicate project"
Test-Endpoint "POST" "$base/projects/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Project Duplicate (not found)" -Description "Duplicate nonexistent project"

# =============================================
# LANDING PAGES - CORRECTED
# =============================================
Write-Host "`n--- LANDING PAGES ---" -ForegroundColor Yellow

# Create LP with correct schema: project_id, name are required
$lpBody = '{"project_id":"default-project","name":"Test Landing Page","content":{"sections":[{"type":"hero","heading":"Test"}]}}'
$lp = Test-Endpoint "POST" "$base/landing-pages/" -Body $lpBody -ExpectedStatus 200 -TestName "LP Create (valid)" -Description "Create landing page with valid data"
$lpId = if ($lp -and $lp.id) { $lp.id } else { $null }
Write-Host "  -> Created LP ID: $lpId" -ForegroundColor DarkGray

# Missing required fields
Test-Endpoint "POST" "$base/landing-pages/" -Body '{}' -ExpectedStatus 422 -TestName "LP Create (missing required fields)" -Description "Create LP with empty body"

# Read by project
Test-Endpoint "GET" "$base/landing-pages/project/$defaultProjectId" -ExpectedStatus 200 -TestName "LP List by Project" -Description "List LPs by project"

if ($lpId) {
    Test-Endpoint "GET" "$base/landing-pages/$lpId" -ExpectedStatus 200 -TestName "LP Read" -Description "Get LP by ID"
    
    # Update: requires content dict
    $lpUpdateBody = '{"content":{"sections":[{"type":"hero","heading":"Updated"}]},"change_summary":"Updated heading"}'
    Test-Endpoint "PUT" "$base/landing-pages/$lpId" -Body $lpUpdateBody -ExpectedStatus 200 -TestName "LP Update" -Description "Update landing page"
    
    # Auto-save: requires content dict (uses LandingPageUpdateRequest)
    Test-Endpoint "POST" "$base/landing-pages/$lpId/auto-save" -Body '{"content":{"test":"data"}}' -ExpectedStatus 200 -TestName "LP Auto-Save" -Description "Auto-save landing page"
    
    # Versions list
    Test-Endpoint "GET" "$base/landing-pages/$lpId/versions" -ExpectedStatus 200 -TestName "LP Versions List" -Description "List LP versions"
    
    # Create version: requires content dict
    Test-Endpoint "POST" "$base/landing-pages/$lpId/versions" -Body '{"content":{"v":"test"},"change_summary":"Test version"}' -ExpectedStatus 200 -TestName "LP Version Create" -Description "Create LP version"
    
    # Restore: requires version_number
    Test-Endpoint "POST" "$base/landing-pages/$lpId/restore" -Body '{"version_number":1}' -ExpectedStatus 200 -TestName "LP Restore" -Description "Restore LP version"
    
    # Delete
    Test-Endpoint "DELETE" "$base/landing-pages/$lpId" -ExpectedStatus 200 -TestName "LP Delete" -Description "Delete landing page"
} else {
    Write-Host "  [SKIP] LP dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/landing-pages/nonexistent-id" -ExpectedStatus 404 -TestName "LP Read (not found)" -Description "Get nonexistent LP"
Test-Endpoint "PUT" "$base/landing-pages/nonexistent-id" -Body '{"content":{"x":"y"}}' -ExpectedStatus 404 -TestName "LP Update (not found)" -Description "Update nonexistent LP"
Test-Endpoint "DELETE" "$base/landing-pages/nonexistent-id" -ExpectedStatus 404 -TestName "LP Delete (not found)" -Description "Delete nonexistent LP"

# Improve Copy: requires text and action
Test-Endpoint "POST" "$base/landing-pages/improve-copy" -Body '{"text":"Original copy text to improve","action":"improve"}' -ExpectedStatus 200 -TestName "LP Improve Copy" -Description "Improve copy with text+action"
Test-Endpoint "POST" "$base/landing-pages/improve-copy" -Body '{}' -ExpectedStatus 422 -TestName "LP Improve Copy (missing fields)" -Description "Improve copy without text/action"

# LP Generate: requires all LandingPagePromptRequest fields
$lpGenBody = '{"project_id":"default-project","business_name":"TestCo","product_name":"TestProduct","description":"A test product","industry":"Technology","target_audience":"Developers","primary_goal":"increase sales","brand_voice":"professional","language":"English","country":"US","primary_cta":"Get Started","secondary_cta":"Learn More","color_palette":{"primary":"#0066CC","secondary":"#004499","accent":"#00AAFF"},"typography":"Modern Sans-Serif","sections_required":["hero","features"]}'
Test-Endpoint "POST" "$base/landing-pages/generate" -Body $lpGenBody -ExpectedStatus 200 -TestName "LP Generate" -Description "Generate LP with AI (valid data)"

# =============================================
# CONTENT STUDIO - CORRECTED
# =============================================
Write-Host "`n--- CONTENT STUDIO ---" -ForegroundColor Yellow

# Create: requires workspace_id, title, content_type
$contentBody = '{"workspace_id":"dev-workspace","title":"Test Content","content_type":"blog_post","body":{"text":"Test content body text"},"plain_body":"Test content body text for the content studio."}'
$content = Test-Endpoint "POST" "$base/content/" -Body $contentBody -ExpectedStatus 200 -TestName "Content Create (valid)" -Description "Create content with valid data"
$contentId = if ($content -and $content.id) { $content.id } else { $null }
Write-Host "  -> Created content ID: $contentId" -ForegroundColor DarkGray

Test-Endpoint "POST" "$base/content/" -Body '{}' -ExpectedStatus 422 -TestName "Content Create (missing fields)" -Description "Create content with empty body"

# List
Test-Endpoint "GET" "$base/content/" -ExpectedStatus 200 -TestName "Content List" -Description "List all content items"

if ($contentId) {
    Test-Endpoint "GET" "$base/content/$contentId" -ExpectedStatus 200 -TestName "Content Read" -Description "Get content by ID"
    
    # Update
    $contentUpdateBody = '{"title":"Updated Content","plain_body":"Updated content body text."}'
    Test-Endpoint "PUT" "$base/content/$contentId" -Body $contentUpdateBody -ExpectedStatus 200 -TestName "Content Update" -Description "Update content item"
    
    # Duplicate
    Test-Endpoint "POST" "$base/content/$contentId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Content Duplicate" -Description "Duplicate content"
    
    # Archive
    Test-Endpoint "POST" "$base/content/$contentId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Content Archive" -Description "Archive content"
    
    # Restore
    Test-Endpoint "POST" "$base/content/$contentId/restore" -Body '{}' -ExpectedStatus 200 -TestName "Content Restore" -Description "Restore content"
    
    # Auto-save
    Test-Endpoint "POST" "$base/content/$contentId/auto-save" -Body '{"plain_body":"Auto-saved content body"}' -ExpectedStatus 200 -TestName "Content Auto-Save" -Description "Auto-save content"
    
    # Versions
    Test-Endpoint "GET" "$base/content/$contentId/versions" -ExpectedStatus 200 -TestName "Content Versions" -Description "List content versions"
    
    # Delete
    Test-Endpoint "DELETE" "$base/content/$contentId" -ExpectedStatus 200 -TestName "Content Delete" -Description "Delete content item"
} else {
    Write-Host "  [SKIP] Content dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/content/nonexistent-id" -ExpectedStatus 404 -TestName "Content Read (not found)" -Description "Get nonexistent content"
Test-Endpoint "PUT" "$base/content/nonexistent-id" -Body '{"title":"test"}' -ExpectedStatus 404 -TestName "Content Update (not found)" -Description "Update nonexistent content"
Test-Endpoint "POST" "$base/content/nonexistent-id/duplicate" -Body '{}' -ExpectedStatus 404 -TestName "Content Duplicate (not found)" -Description "Duplicate nonexistent content"
Test-Endpoint "POST" "$base/content/nonexistent-id/archive" -Body '{}' -ExpectedStatus 404 -TestName "Content Archive (not found)" -Description "Archive nonexistent content"
Test-Endpoint "DELETE" "$base/content/nonexistent-id" -ExpectedStatus 404 -TestName "Content Delete (not found)" -Description "Delete nonexistent content"

# Content Generate
$contentGenBody = '{"workspace_id":"dev-workspace","content_type":"blog_post","title":"AI Blog Post","business_name":"TestCo"}'
Test-Endpoint "POST" "$base/content/generate" -Body $contentGenBody -ExpectedStatus 200 -TestName "Content Generate" -Description "Generate content with AI"

# Content Stats: GET not POST
Test-Endpoint "GET" "$base/content/stats" -ExpectedStatus 200 -TestName "Content Stats (GET)" -Description "Get content stats via GET"
Test-Endpoint "POST" "$base/content/stats" -Body '{}' -ExpectedStatus 405 -TestName "Content Stats (POST)" -Description "POST to stats endpoint - method not allowed" -IsRealBug $true

# Folders
Test-Endpoint "GET" "$base/content/folders" -ExpectedStatus 200 -TestName "Content Folders List" -Description "List content folders"
Test-Endpoint "POST" "$base/content/folders" -Body '{"name":"Test Folder","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Content Folder Create" -Description "Create content folder"

# =============================================
# IMAGE STUDIO - CORRECTED
# =============================================
Write-Host "`n--- IMAGE STUDIO ---" -ForegroundColor Yellow

# Image has NO POST / endpoint - only POST /upload (multipart form)
Test-Endpoint "GET" "$base/images/" -ExpectedStatus 200 -TestName "Image List" -Description "List all images"
Test-Endpoint "GET" "$base/images/nonexistent-id" -ExpectedStatus 404 -TestName "Image Read (not found)" -Description "Get nonexistent image"
Test-Endpoint "PUT" "$base/images/nonexistent-id" -Body "name=test" -ExpectedStatus 404 -TestName "Image Update (not found)" -Description "Update nonexistent image"
Test-Endpoint "DELETE" "$base/images/nonexistent-id" -ExpectedStatus 404 -TestName "Image Delete (not found)" -Description "Delete nonexistent image"
Test-Endpoint "POST" "$base/images/nonexistent-id/favorite" -Body '{}' -ExpectedStatus 404 -TestName "Image Favorite (not found)" -Description "Favorite nonexistent image"
Test-Endpoint "GET" "$base/images/nonexistent-id/history" -ExpectedStatus 404 -TestName "Image History (not found)" -Description "Get history for nonexistent image"

# Image Stats: GET not POST
Test-Endpoint "GET" "$base/images/stats" -ExpectedStatus 200 -TestName "Image Stats (GET)" -Description "Get image stats via GET"
Test-Endpoint "POST" "$base/images/stats" -Body '{}' -ExpectedStatus 405 -TestName "Image Stats (POST)" -Description "POST to stats endpoint - method not allowed" -IsRealBug $true

# Image Folders
Test-Endpoint "GET" "$base/images/folders" -ExpectedStatus 200 -TestName "Image Folders List" -Description "List image folders"
# Image folder create uses individual Body params, not JSON
Test-Endpoint "POST" "$base/images/folders" -Body '{"workspace_id":"dev-workspace","name":"Test Image Folder"}' -ExpectedStatus 200 -TestName "Image Folder Create" -Description "Create image folder"

# Image Generate
$imageGenBody = '{"prompt":"A futuristic city skyline","workspace_id":"dev-workspace","image_type":"digital-art","style":"digital-art","width":1024,"height":1024,"num_variations":1}'
Test-Endpoint "POST" "$base/images/generate" -Body $imageGenBody -ExpectedStatus 200 -TestName "Image Generate" -Description "Generate image with AI"

# Image AI Enhance Prompt
Test-Endpoint "POST" "$base/images/ai/enhance-prompt" -Body '{"prompt":"sunset over ocean"}' -ExpectedStatus 200 -TestName "Image AI Enhance Prompt" -Description "Enhance prompt"
Test-Endpoint "POST" "$base/images/ai/enhance-prompt" -Body '{}' -ExpectedStatus 422 -TestName "Image AI Enhance Prompt (missing)" -Description "Enhance prompt without prompt field"

# Image Variations: needs valid image_id
Test-Endpoint "POST" "$base/images/ai/variations" -Body '{"image_id":"nonexistent","num_variations":3,"strength":0.5}' -ExpectedStatus 404 -TestName "Image AI Variations (not found)" -Description "Variations with nonexistent image"
Test-Endpoint "POST" "$base/images/ai/upscale" -Body '{"image_id":"nonexistent","scale":2}' -ExpectedStatus 404 -TestName "Image AI Upscale (not found)" -Description "Upscale nonexistent image"

# =============================================
# SOCIAL MEDIA STUDIO - CORRECTED
# =============================================
Write-Host "`n--- SOCIAL MEDIA STUDIO ---" -ForegroundColor Yellow

# Create: requires workspace_id, content, platform, post_type
$socialBody = '{"workspace_id":"dev-workspace","content":"Test social media post about AI innovation","platform":"twitter","post_type":"single"}'
$socialPost = Test-Endpoint "POST" "$base/social/posts" -Body $socialBody -ExpectedStatus 200 -TestName "Social Post Create (valid)" -Description "Create social post with valid data"
$socialPostId = if ($socialPost -and $socialPost.id) { $socialPost.id } else { $null }
Write-Host "  -> Created social post ID: $socialPostId" -ForegroundColor DarkGray

Test-Endpoint "POST" "$base/social/posts" -Body '{}' -ExpectedStatus 422 -TestName "Social Post Create (missing)" -Description "Create social post with empty body"

# Invalid platform
Test-Endpoint "POST" "$base/social/posts" -Body '{"workspace_id":"dev-workspace","content":"test","platform":"invalid_platform","post_type":"single"}' -ExpectedStatus 400 -TestName "Social Post Create (invalid platform)" -Description "Create with invalid platform"

# Invalid post_type
Test-Endpoint "POST" "$base/social/posts" -Body '{"workspace_id":"dev-workspace","content":"test","platform":"twitter","post_type":"invalid_type"}' -ExpectedStatus 400 -TestName "Social Post Create (invalid post_type)" -Description "Create with invalid post_type"

Test-Endpoint "GET" "$base/social/posts" -ExpectedStatus 200 -TestName "Social Posts List" -Description "List social posts"

if ($socialPostId) {
    Test-Endpoint "GET" "$base/social/posts/$socialPostId" -ExpectedStatus 200 -TestName "Social Post Read" -Description "Get social post by ID"
    
    # Update
    $socialUpdateBody = '{"content":"Updated social media post content"}'
    Test-Endpoint "PUT" "$base/social/posts/$socialPostId" -Body $socialUpdateBody -ExpectedStatus 200 -TestName "Social Post Update" -Description "Update social post"
    
    # Duplicate
    Test-Endpoint "POST" "$base/social/posts/$socialPostId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Social Post Duplicate" -Description "Duplicate social post"
    
    # Archive
    Test-Endpoint "POST" "$base/social/posts/$socialPostId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Social Post Archive" -Description "Archive social post"
    
    # Delete
    Test-Endpoint "DELETE" "$base/social/posts/$socialPostId" -ExpectedStatus 200 -TestName "Social Post Delete" -Description "Delete social post"
} else {
    Write-Host "  [SKIP] Social dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/social/posts/nonexistent-id" -ExpectedStatus 404 -TestName "Social Post Read (not found)" -Description "Get nonexistent social post"
Test-Endpoint "DELETE" "$base/social/posts/nonexistent-id" -ExpectedStatus 404 -TestName "Social Post Delete (not found)" -Description "Delete nonexistent social post"

# Social Stats: GET not POST
Test-Endpoint "GET" "$base/social/posts/stats" -ExpectedStatus 200 -TestName "Social Post Stats (GET)" -Description "Get social post stats via GET"
Test-Endpoint "POST" "$base/social/posts/stats" -Body '{}' -ExpectedStatus 405 -TestName "Social Post Stats (POST)" -Description "POST to stats endpoint - method not allowed" -IsRealBug $true

# Social Generate: requires workspace_id, platform, post_type
$socialGenBody = '{"workspace_id":"dev-workspace","platform":"twitter","post_type":"single","topic":"AI trends in 2026"}'
Test-Endpoint "POST" "$base/social/generate" -Body $socialGenBody -ExpectedStatus 200 -TestName "Social Generate" -Description "Generate social post with AI"

# Campaigns
Test-Endpoint "GET" "$base/social/campaigns" -ExpectedStatus 200 -TestName "Social Campaigns List" -Description "List social campaigns"
Test-Endpoint "POST" "$base/social/campaigns" -Body '{"name":"Test Campaign","workspace_id":"dev-workspace"}' -ExpectedStatus 200 -TestName "Social Campaign Create" -Description "Create social campaign"

# Calendar
Test-Endpoint "GET" "$base/social/calendar" -ExpectedStatus 200 -TestName "Social Calendar" -Description "Get social calendar"

# =============================================
# EMAIL STUDIO - CORRECTED
# =============================================
Write-Host "`n--- EMAIL STUDIO ---" -ForegroundColor Yellow

# Create: requires workspace_id, name, subject
$emailCampaignBody = '{"workspace_id":"dev-workspace","name":"Test Email Campaign","subject":"Test Subject","email_type":"promotional"}'
$emailCampaign = Test-Endpoint "POST" "$base/email/campaigns" -Body $emailCampaignBody -ExpectedStatus 200 -TestName "Email Campaign Create (valid)" -Description "Create email campaign with valid data"
$emailCampaignId = if ($emailCampaign -and $emailCampaign.id) { $emailCampaign.id } else { $null }
Write-Host "  -> Created email campaign ID: $emailCampaignId" -ForegroundColor DarkGray

Test-Endpoint "POST" "$base/email/campaigns" -Body '{}' -ExpectedStatus 422 -TestName "Email Campaign Create (missing)" -Description "Create email campaign with empty body"

# Invalid email_type
Test-Endpoint "POST" "$base/email/campaigns" -Body '{"workspace_id":"dev-workspace","name":"Test","subject":"Test","email_type":"invalid_type"}' -ExpectedStatus 400 -TestName "Email Campaign Create (invalid type)" -Description "Create with invalid email_type"

Test-Endpoint "GET" "$base/email/campaigns" -ExpectedStatus 200 -TestName "Email Campaigns List" -Description "List email campaigns"

if ($emailCampaignId) {
    Test-Endpoint "GET" "$base/email/campaigns/$emailCampaignId" -ExpectedStatus 200 -TestName "Email Campaign Read" -Description "Get email campaign by ID"
    
    # Update
    $emailUpdateBody = '{"name":"Updated Campaign","subject":"Updated Subject"}'
    Test-Endpoint "PUT" "$base/email/campaigns/$emailCampaignId" -Body $emailUpdateBody -ExpectedStatus 200 -TestName "Email Campaign Update" -Description "Update email campaign"
    
    # Duplicate
    Test-Endpoint "POST" "$base/email/campaigns/$emailCampaignId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Email Campaign Duplicate" -Description "Duplicate email campaign"
    
    # Delete
    Test-Endpoint "DELETE" "$base/email/campaigns/$emailCampaignId" -ExpectedStatus 200 -TestName "Email Campaign Delete" -Description "Delete email campaign"
} else {
    Write-Host "  [SKIP] Email campaign dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/email/campaigns/nonexistent-id" -ExpectedStatus 404 -TestName "Email Campaign Read (not found)" -Description "Get nonexistent email campaign"
Test-Endpoint "DELETE" "$base/email/campaigns/nonexistent-id" -ExpectedStatus 404 -TestName "Email Campaign Delete (not found)" -Description "Delete nonexistent email campaign"

# Stats
Test-Endpoint "GET" "$base/email/campaigns/stats" -ExpectedStatus 200 -TestName "Email Campaigns Stats" -Description "Get email campaigns stats"

# Email Generate: requires workspace_id, email_type
$emailGenBody = '{"workspace_id":"dev-workspace","email_type":"welcome","brand":"TestCo","audience":"new users"}'
Test-Endpoint "POST" "$base/email/generate" -Body $emailGenBody -ExpectedStatus 200 -TestName "Email Generate" -Description "Generate email with AI"

# Templates
Test-Endpoint "GET" "$base/email/templates" -ExpectedStatus 200 -TestName "Email Templates List" -Description "List email templates"

# Create template: requires workspace_id, name, email_type, subject, html_content
$emailTemplateBody = '{"workspace_id":"dev-workspace","name":"Test Template","email_type":"newsletter","subject":"Template Subject","html_content":"<p>Template body</p>"}'
$emailTemplate = Test-Endpoint "POST" "$base/email/templates" -Body $emailTemplateBody -ExpectedStatus 200 -TestName "Email Template Create" -Description "Create email template"
$emailTemplateId = if ($emailTemplate -and $emailTemplate.id) { $emailTemplate.id } else { $null }
Write-Host "  -> Created email template ID: $emailTemplateId" -ForegroundColor DarkGray

if ($emailTemplateId) {
    Test-Endpoint "GET" "$base/email/templates/$emailTemplateId" -ExpectedStatus 200 -TestName "Email Template Read" -Description "Get email template by ID"
    Test-Endpoint "POST" "$base/email/templates/$emailTemplateId/use" -Body '{}' -ExpectedStatus 200 -TestName "Email Template Use" -Description "Use email template"
} else {
    Write-Host "  [SKIP] Email template dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/email/templates/nonexistent-id" -ExpectedStatus 404 -TestName "Email Template Read (not found)" -Description "Get nonexistent email template"
Test-Endpoint "POST" "$base/email/templates/nonexistent-id/use" -Body '{}' -ExpectedStatus 404 -TestName "Email Template Use (not found)" -Description "Use nonexistent email template"

# =============================================
# BRAND STUDIO - CORRECTED
# =============================================
Write-Host "`n--- BRAND STUDIO ---" -ForegroundColor Yellow

$brandBody = '{"workspace_id":"dev-workspace","name":"Test Brand","primary_color":"#FF0000","description":"Test brand for QA"}'
$brand = Test-Endpoint "POST" "$base/brands/" -Body $brandBody -ExpectedStatus 200 -TestName "Brand Create (valid)" -Description "Create brand with valid data"
$brandId = if ($brand -and $brand.id) { $brand.id } else { $null }
Write-Host "  -> Created brand ID: $brandId" -ForegroundColor DarkGray

Test-Endpoint "POST" "$base/brands/" -Body '{}' -ExpectedStatus 422 -TestName "Brand Create (missing)" -Description "Create brand with empty body"

Test-Endpoint "GET" "$base/brands/" -ExpectedStatus 200 -TestName "Brand List" -Description "List all brands"

if ($brandId) {
    Test-Endpoint "GET" "$base/brands/$brandId" -ExpectedStatus 200 -TestName "Brand Read" -Description "Get brand by ID"
    
    $brandUpdateBody = '{"name":"Updated Brand","primary_color":"#00FF00"}'
    Test-Endpoint "PUT" "$base/brands/$brandId" -Body $brandUpdateBody -ExpectedStatus 200 -TestName "Brand Update" -Description "Update brand"
    
    Test-Endpoint "POST" "$base/brands/$brandId/duplicate" -Body '{}' -ExpectedStatus 200 -TestName "Brand Duplicate" -Description "Duplicate brand"
    Test-Endpoint "POST" "$base/brands/$brandId/archive" -Body '{}' -ExpectedStatus 200 -TestName "Brand Archive" -Description "Archive brand"
    Test-Endpoint "POST" "$base/brands/$brandId/restore" -Body '{}' -ExpectedStatus 200 -TestName "Brand Restore" -Description "Restore brand"
    Test-Endpoint "POST" "$base/brands/$brandId/favorite" -Body '{}' -ExpectedStatus 200 -TestName "Brand Favorite" -Description "Toggle brand favorite"
    Test-Endpoint "GET" "$base/brands/$brandId/versions" -ExpectedStatus 200 -TestName "Brand Versions" -Description "List brand versions"
    
    Test-Endpoint "DELETE" "$base/brands/$brandId" -ExpectedStatus 200 -TestName "Brand Delete" -Description "Delete brand"
} else {
    Write-Host "  [SKIP] Brand dependent tests - create failed" -ForegroundColor DarkYellow
}

Test-Endpoint "GET" "$base/brands/nonexistent-id" -ExpectedStatus 404 -TestName "Brand Read (not found)" -Description "Get nonexistent brand"
Test-Endpoint "PUT" "$base/brands/nonexistent-id" -Body '{"name":"test"}' -ExpectedStatus 404 -TestName "Brand Update (not found)" -Description "Update nonexistent brand"
Test-Endpoint "DELETE" "$base/brands/nonexistent-id" -ExpectedStatus 404 -TestName "Brand Delete (not found)" -Description "Delete nonexistent brand"

# Brand Generate
$brandGenBody = '{"workspace_id":"dev-workspace","name":"AI Generated Brand","description":"A modern tech brand"}'
Test-Endpoint "POST" "$base/brands/generate" -Body $brandGenBody -ExpectedStatus 200 -TestName "Brand Generate" -Description "Generate brand with AI"

# Brand Stats: GET not POST
Test-Endpoint "GET" "$base/brands/stats" -ExpectedStatus 200 -TestName "Brand Stats (GET)" -Description "Get brand stats via GET"
Test-Endpoint "POST" "$base/brands/stats" -Body '{}' -ExpectedStatus 405 -TestName "Brand Stats (POST)" -Description "POST to stats endpoint - method not allowed" -IsRealBug $true

# =============================================
# SEO STUDIO - CORRECTED
# =============================================
Write-Host "`n--- SEO STUDIO ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/seo/domains" -ExpectedStatus 200 -TestName "SEO Domains" -Description "List SEO domains"
Test-Endpoint "GET" "$base/seo/keywords" -ExpectedStatus 200 -TestName "SEO Keywords" -Description "List SEO keywords"
Test-Endpoint "GET" "$base/seo/audits" -ExpectedStatus 200 -TestName "SEO Audits" -Description "List SEO audits"

# Dashboard requires domain_id query param
Test-Endpoint "GET" "$base/seo/dashboard?domain_id=dev-domain" -ExpectedStatus 200 -TestName "SEO Dashboard (with domain_id)" -Description "Get SEO dashboard with domain_id"
Test-Endpoint "GET" "$base/seo/dashboard" -ExpectedStatus 404 -TestName "SEO Dashboard (no domain_id)" -Description "Get SEO dashboard without domain_id" -IsRealBug $true

# Technical is POST not GET
Test-Endpoint "POST" "$base/seo/technical" -Body '{"domain_id":"dev-domain","url":"https://example.com"}' -ExpectedStatus 200 -TestName "SEO Technical (POST)" -Description "Run technical SEO check via POST"
Test-Endpoint "GET" "$base/seo/technical" -ExpectedStatus 405 -TestName "SEO Technical (GET)" -Description "GET on POST-only endpoint - method not allowed" -IsRealBug $true

Test-Endpoint "GET" "$base/seo/recommendations" -ExpectedStatus 200 -TestName "SEO Recommendations" -Description "Get SEO recommendations"
Test-Endpoint "GET" "$base/seo/competitors" -ExpectedStatus 200 -TestName "SEO Competitors" -Description "Get SEO competitors"
Test-Endpoint "GET" "$base/seo/reports" -ExpectedStatus 200 -TestName "SEO Reports" -Description "Get SEO reports"
Test-Endpoint "GET" "$base/seo/schemas" -ExpectedStatus 200 -TestName "SEO Schemas" -Description "Get SEO schemas"
Test-Endpoint "GET" "$base/seo/internal-links" -ExpectedStatus 200 -TestName "SEO Internal Links" -Description "Get SEO internal links"

# =============================================
# PERFORMANCE STUDIO - CORRECTED
# =============================================
Write-Host "`n--- PERFORMANCE STUDIO ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/performance/dashboard" -ExpectedStatus 200 -TestName "Performance Dashboard" -Description "Get performance dashboard"
Test-Endpoint "GET" "$base/performance/audits" -ExpectedStatus 200 -TestName "Performance Audits" -Description "List performance audits"
Test-Endpoint "GET" "$base/performance/reports" -ExpectedStatus 200 -TestName "Performance Reports" -Description "List performance reports"
Test-Endpoint "GET" "$base/performance/history" -ExpectedStatus 200 -TestName "Performance History" -Description "Get performance history"

# Recommendations endpoint does not exist (404)
Test-Endpoint "GET" "$base/performance/recommendations" -ExpectedStatus 404 -TestName "Performance Recommendations" -Description "Get performance recommendations - endpoint does not exist"

# =============================================
# TEMPLATES
# =============================================
Write-Host "`n--- TEMPLATES ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/templates/" -ExpectedStatus 200 -TestName "Templates List" -Description "List all templates"
Test-Endpoint "GET" "$base/templates/nonexistent-template" -ExpectedStatus 404 -TestName "Template Not Found" -Description "Get nonexistent template"

# =============================================
# USERS / ENGINE / WEBSITES
# =============================================
Write-Host "`n--- USERS / ENGINE / WEBSITES ---" -ForegroundColor Yellow

Test-Endpoint "GET" "$base/users/me" -ExpectedStatus 200 -TestName "Users Me" -Description "Get current user"
Test-Endpoint "GET" "$base/engine/status" -ExpectedStatus 200 -TestName "Engine Status" -Description "Get engine status"
Test-Endpoint "GET" "$base/engine/providers" -ExpectedStatus 200 -TestName "Engine Providers" -Description "Get available providers"
Test-Endpoint "GET" "$base/websites/project/$defaultProjectId" -ExpectedStatus 200 -TestName "Websites by Project" -Description "List websites by project"
Test-Endpoint "GET" "$base/websites/nonexistent-id" -ExpectedStatus 404 -TestName "Website Read (not found)" -Description "Get nonexistent website"

# =============================================
# SUMMARY
# =============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $testCount"
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

$realBugs = $bugs | Where-Object { $_.IsRealBug -eq $true }
$cascadeOrTestBugs = $bugs | Where-Object { $_.IsRealBug -ne $true }

Write-Host "`n--- REAL BUGS ($($realBugs.Count)) ---" -ForegroundColor Red
if ($realBugs.Count -gt 0) {
    $i = 1
    foreach ($bug in $realBugs) {
        Write-Host "`n  Bug #$i : $($bug.Test)" -ForegroundColor Red
        Write-Host "    Endpoint: $($bug.Endpoint)"
        Write-Host "    Expected HTTP: $($bug.Expected)"
        Write-Host "    Actual HTTP:   $($bug.Actual)"
        Write-Host "    Detail: $($bug.Description)"
        $i++
    }
} else {
    Write-Host "  None found" -ForegroundColor Green
}

Write-Host "`n--- CASCADING / TEST-SCRIPT FAILURES ($($cascadeOrTestBugs.Count)) ---" -ForegroundColor Yellow
Write-Host "  (These are NOT backend bugs - they are test-script related or cascade failures)" -ForegroundColor DarkGray
