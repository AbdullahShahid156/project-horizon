from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if DB is available
    try:
        from app.core.database import engine, Base
        from app.models import (  # noqa: F401 - ensure all models are imported
            User, Organization, Membership, Workspace, Project,
            GeneratedWebsite, WebsiteVersion, LandingPage, LandingPageVersion,
            ContentItem, ContentVersion, ContentTemplate, ContentFolder,
            ContentTag, ContentItemTag, ContentExport,
            SEODomain, SEOAudit, SEOAuditPage, SEOKeyword, SEOKeywordCluster,
            SEOKeywordRanking, SEOSchema, SEOReport, SEORecommendation,
            SEOCompetitor, SEOHistory, SEOInternalLink,
            PerformanceAudit, CoreWebVitals, PerformanceRecommendation,
            OptimizationHistory, PerformanceReport, ImageAudit, AssetAudit,
            Brand, BrandVersion, BrandAsset,
            Image, ImageFolder, ImageHistory,
            SocialPost, SocialCampaign, SocialCalendar, SocialHashtag, SocialPostHistory,
            EmailCampaign, EmailTemplate, EmailHistory,
        )
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully")
    except Exception as e:
        print(f"Database connection unavailable: {e}")
        print("Backend will run with in-memory storage for studio features")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
