import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user

from app.engine import get_ai_engine, JobStatus
from app.schemas.ai_engine import (
    GenerateRequest,
    GenerateResponse,
    PromptRenderRequest,
    PromptRenderResponse,
    PromptTemplateResponse,
    JobSubmitRequest,
    JobResponse,
    UsageSummaryResponse,
    DailyUsageResponse,
    CacheStatsResponse,
    ProviderInfo,
    AIEngineStatusResponse,
)

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
async def generate_text(data: GenerateRequest, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    try:
        response = await engine.generate(
            prompt=data.prompt,
            system_instruction=data.system_instruction,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            provider=data.provider,
            use_cache=data.use_cache,
            user_id=user,
            operation="generate",
        )

        return GenerateResponse(
            text=response.text if response.success else "",
            provider=response.provider or "none",
            model=response.model or "unknown",
            latency_ms=response.latency_ms or 0,
            tokens={
                "prompt_tokens": response.tokens.prompt_tokens if response.tokens else 0,
                "completion_tokens": response.tokens.completion_tokens if response.tokens else 0,
                "total_tokens": response.tokens.total_tokens if response.tokens else 0,
                "estimated_cost": response.tokens.estimated_cost if response.tokens else 0,
            },
        )
    except HTTPException:
        raise
    except Exception:
        return GenerateResponse(
            text="", provider="none", model="unknown", latency_ms=0,
            tokens={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost": 0},
        )


@router.post("/generate-json", response_model=GenerateResponse)
async def generate_json(data: GenerateRequest, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    try:
        response = await engine.generate_json(
            prompt=data.prompt,
            system_instruction=data.system_instruction,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            provider=data.provider,
            use_cache=data.use_cache,
            user_id=user,
            operation="generate_json",
        )

        return GenerateResponse(
            text=str(response.json_data) if response.success and response.json_data else (response.text if response.success else ""),
            provider=response.provider or "none",
            model=response.model or "unknown",
            latency_ms=response.latency_ms or 0,
            tokens={
                "prompt_tokens": response.tokens.prompt_tokens if response.tokens else 0,
                "completion_tokens": response.tokens.completion_tokens if response.tokens else 0,
                "total_tokens": response.tokens.total_tokens if response.tokens else 0,
                "estimated_cost": response.tokens.estimated_cost if response.tokens else 0,
            },
        )
    except HTTPException:
        raise
    except Exception:
        return GenerateResponse(
            text="", provider="none", model="unknown", latency_ms=0,
            tokens={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost": 0},
        )


@router.post("/render-prompt", response_model=PromptRenderResponse)
async def render_prompt(data: PromptRenderRequest, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    try:
        template = engine.prompts.get(data.template_name, data.category)
        if template is None:
            raise HTTPException(status_code=404, detail="Template not found")
        rendered = template.render(**data.variables)
        return PromptRenderResponse(
            rendered=rendered,
            template_name=template.name,
            category=template.category,
            version=template.version,
            variables_used=template.variables,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/prompts", response_model=list[PromptTemplateResponse])
async def list_prompts(category: str | None = None, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    if category:
        templates = engine.prompts.list_by_category(category)
    else:
        templates = engine.prompts.list_all()
    return [
        PromptTemplateResponse(
            name=t.name,
            category=t.category,
            version=t.version,
            description=t.description,
            variables=t.variables,
        )
        for t in templates
    ]


@router.get("/prompts/categories")
async def list_prompt_categories(user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    return {"categories": engine.prompts.list_categories()}


@router.post("/jobs", response_model=JobResponse)
async def submit_job(data: JobSubmitRequest, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    job_id = engine.submit_job(data.type, data.params, user)
    job = engine.get_job(job_id)
    return JobResponse(
        id=job.id,
        type=job.type,
        status=job.status.value,
        progress=job.progress,
        result=job.result,
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    job = engine.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(
        id=job.id,
        type=job.type,
        status=job.status.value,
        progress=job.progress,
        result=job.result,
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    status: str | None = None,
    limit: int = 50,
    user: str = Depends(get_current_user),
):
    engine = get_ai_engine()
    job_status = JobStatus(status) if status else None
    jobs = engine.list_jobs(user, job_status)
    return [
        JobResponse(
            id=j.id,
            type=j.type,
            status=j.status.value,
            progress=j.progress,
            result=j.result,
            error=j.error,
            created_at=j.created_at,
            started_at=j.started_at,
            completed_at=j.completed_at,
        )
        for j in jobs[:limit]
    ]


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    success = engine.cancel_job(job_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel job")
    return {"detail": "Job cancelled"}


@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage_summary(days: int = 30, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    return engine.get_usage_summary(user, days)


@router.get("/usage/daily", response_model=list[DailyUsageResponse])
async def get_daily_usage(days: int = 30, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    return engine.get_daily_usage(days)


@router.get("/usage/history")
async def get_usage_history(limit: int = 50, user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    return engine.get_usage_history(user, limit)


@router.get("/cache", response_model=CacheStatsResponse)
async def get_cache_stats(user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    return engine.get_cache_stats()


@router.post("/cache/clear")
async def clear_cache(user: str = Depends(get_current_user)):
    engine = get_ai_engine()
    count = engine.clear_cache()
    return {"detail": f"Cleared {count} cached entries"}


@router.get("/providers", response_model=list[ProviderInfo])
async def list_providers(user: str = Depends(get_current_user)):
    from app.core.config import settings
    engine = get_ai_engine()
    providers = []
    for name in engine.registry.list_providers():
        providers.append(ProviderInfo(
            name=name,
            available=True,
            is_active=(name == settings.AI_PROVIDER),
        ))
    return providers


@router.get("/status", response_model=AIEngineStatusResponse)
async def get_engine_status(user: str = Depends(get_current_user)):
    from app.core.config import settings
    engine = get_ai_engine()
    providers = [
        ProviderInfo(
            name=name,
            available=True,
            is_active=(name == settings.AI_PROVIDER),
        )
        for name in engine.registry.list_providers()
    ]
    return AIEngineStatusResponse(
        providers=providers,
        active_provider=settings.AI_PROVIDER,
        cache_stats=engine.get_cache_stats(),
        queue_size=len(engine.queue.list_jobs()),
        total_jobs=len(engine.queue._jobs),
    )
