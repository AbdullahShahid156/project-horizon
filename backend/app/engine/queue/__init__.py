import asyncio
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AIJob:
    id: str
    type: str
    status: JobStatus = JobStatus.PENDING
    params: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] | None = None
    error: str | None = None
    progress: float = 0.0
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    completed_at: float | None = None
    retries: int = 0
    max_retries: int = 3
    user_id: str | None = None


class AIJobQueue:
    """In-memory job queue for AI operations."""

    def __init__(self, max_concurrent: int = 3) -> None:
        self._jobs: dict[str, AIJob] = {}
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._running: int = 0
        self._max_concurrent = max_concurrent
        self._handlers: dict[str, Callable] = {}
        self._task: asyncio.Task | None = None

    def register_handler(self, job_type: str, handler: Callable) -> None:
        self._handlers[job_type] = handler

    async def submit(self, job: AIJob) -> str:
        self._jobs[job.id] = job
        await self._queue.put(job.id)
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._process_loop())
        return job.id

    def get_job(self, job_id: str) -> AIJob | None:
        return self._jobs.get(job_id)

    def list_jobs(
        self,
        user_id: str | None = None,
        status: JobStatus | None = None,
        limit: int = 50,
    ) -> list[AIJob]:
        jobs = list(self._jobs.values())
        if user_id:
            jobs = [j for j in jobs if j.user_id == user_id]
        if status:
            jobs = [j for j in jobs if j.status == status]
        jobs.sort(key=lambda j: j.created_at, reverse=True)
        return jobs[:limit]

    def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if job and job.status in (JobStatus.PENDING, JobStatus.RUNNING):
            job.status = JobStatus.CANCELLED
            job.completed_at = time.time()
            return True
        return False

    async def _process_loop(self) -> None:
        while True:
            if self._running >= self._max_concurrent:
                await asyncio.sleep(0.1)
                continue

            try:
                job_id = await asyncio.wait_for(self._queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                break

            job = self._jobs.get(job_id)
            if not job or job.status == JobStatus.CANCELLED:
                continue

            self._running += 1
            try:
                await self._process_job(job)
            finally:
                self._running -= 1

    async def _process_job(self, job: AIJob) -> None:
        job.status = JobStatus.RUNNING
        job.started_at = time.time()

        handler = self._handlers.get(job.type)
        if not handler:
            job.status = JobStatus.FAILED
            job.error = f"No handler registered for job type: {job.type}"
            job.completed_at = time.time()
            return

        try:
            result = await handler(job)
            job.result = result
            job.status = JobStatus.COMPLETED
            job.progress = 100.0
        except Exception as e:
            if job.retries < job.max_retries:
                job.retries += 1
                job.status = JobStatus.PENDING
                await self._queue.put(job.id)
            else:
                job.status = JobStatus.FAILED
                job.error = str(e)
        finally:
            job.completed_at = time.time()


_queue: AIJobQueue | None = None


def get_job_queue() -> AIJobQueue:
    global _queue
    if _queue is None:
        _queue = AIJobQueue()
    return _queue
