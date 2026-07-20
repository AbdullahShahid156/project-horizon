from fastapi import APIRouter

from app.api.v1.endpoints import health, users, projects, websites, ai, landing_pages, templates, ai_engine, content_studio, seo_studio, performance_studio, brand_studio, image_studio, social_studio, email_studio, organizations, workspaces

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(websites.router, prefix="/websites", tags=["websites"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_engine.router, prefix="/engine", tags=["ai-engine"])
api_router.include_router(landing_pages.router, prefix="/landing-pages", tags=["landing-pages"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(content_studio.router, prefix="/content", tags=["content-studio"])
api_router.include_router(seo_studio.router, prefix="/seo", tags=["seo-studio"])
api_router.include_router(performance_studio.router, prefix="/performance", tags=["performance-studio"])
api_router.include_router(brand_studio.router, prefix="/brands", tags=["brand-studio"])
api_router.include_router(image_studio.router, prefix="/images", tags=["image-studio"])
api_router.include_router(social_studio.router, prefix="/social", tags=["social-studio"])
api_router.include_router(email_studio.router, prefix="/email", tags=["email-studio"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
