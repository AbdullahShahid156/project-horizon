import time
from typing import Any
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class UsageRecord:
    id: str
    user_id: str | None
    provider: str
    model: str
    operation: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    latency_ms: float = 0.0
    success: bool = True
    error: str | None = None
    cached: bool = False
    created_at: float = field(default_factory=time.time)


class UsageTracker:
    """Track AI usage, tokens, costs, and performance metrics."""

    def __init__(self) -> None:
        self._records: list[UsageRecord] = []
        self._daily_usage: dict[str, dict[str, Any]] = defaultdict(lambda: {
            "generations": 0,
            "tokens": 0,
            "cost": 0.0,
            "successes": 0,
            "failures": 0,
            "cached": 0,
            "latency_sum": 0.0,
        })

    def record(self, usage: UsageRecord) -> None:
        self._records.append(usage)
        day = time.strftime("%Y-%m-%d", time.localtime(usage.created_at))
        daily = self._daily_usage[day]
        daily["generations"] += 1
        daily["tokens"] += usage.total_tokens
        daily["cost"] += usage.estimated_cost
        if usage.success:
            daily["successes"] += 1
        else:
            daily["failures"] += 1
        if usage.cached:
            daily["cached"] += 1
        daily["latency_sum"] += usage.latency_ms

    def get_summary(
        self,
        user_id: str | None = None,
        days: int = 30,
    ) -> dict[str, Any]:
        cutoff = time.time() - (days * 86400)
        records = [r for r in self._records if r.created_at > cutoff]
        if user_id:
            records = [r for r in records if r.user_id == user_id]

        total_tokens = sum(r.total_tokens for r in records)
        total_cost = sum(r.estimated_cost for r in records)
        total_generations = len(records)
        successes = sum(1 for r in records if r.success)
        failures = sum(1 for r in records if not r.success)
        cached = sum(1 for r in records if r.cached)
        avg_latency = sum(r.latency_ms for r in records) / len(records) if records else 0

        provider_breakdown: dict[str, int] = defaultdict(int)
        model_breakdown: dict[str, int] = defaultdict(int)
        operation_breakdown: dict[str, int] = defaultdict(int)

        for r in records:
            provider_breakdown[r.provider] += 1
            model_breakdown[r.model] += 1
            operation_breakdown[r.operation] += 1

        return {
            "total_generations": total_generations,
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 4),
            "successes": successes,
            "failures": failures,
            "success_rate": round(successes / total_generations * 100, 2) if total_generations > 0 else 0,
            "cached": cached,
            "cache_rate": round(cached / total_generations * 100, 2) if total_generations > 0 else 0,
            "avg_latency_ms": round(avg_latency, 2),
            "providers": dict(provider_breakdown),
            "models": dict(model_breakdown),
            "operations": dict(operation_breakdown),
        }

    def get_daily_usage(self, days: int = 30) -> list[dict[str, Any]]:
        result = []
        for i in range(days):
            day = time.strftime("%Y-%m-%d", time.localtime(time.time() - i * 86400))
            daily = self._daily_usage.get(day, {})
            result.append({
                "date": day,
                "generations": daily.get("generations", 0),
                "tokens": daily.get("tokens", 0),
                "cost": round(daily.get("cost", 0.0), 4),
                "successes": daily.get("successes", 0),
                "failures": daily.get("failures", 0),
                "avg_latency_ms": round(
                    daily["latency_sum"] / daily["generations"], 2
                ) if daily.get("generations", 0) > 0 else 0,
            })
        return list(reversed(result))

    def get_history(
        self,
        user_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        records = list(reversed(self._records))
        if user_id:
            records = [r for r in records if r.user_id == user_id]
        page = records[offset:offset + limit]
        return [
            {
                "id": r.id,
                "provider": r.provider,
                "model": r.model,
                "operation": r.operation,
                "total_tokens": r.total_tokens,
                "estimated_cost": r.estimated_cost,
                "latency_ms": r.latency_ms,
                "success": r.success,
                "error": r.error,
                "cached": r.cached,
                "created_at": r.created_at,
            }
            for r in page
        ]


_tracker: UsageTracker | None = None


def get_usage_tracker() -> UsageTracker:
    global _tracker
    if _tracker is None:
        _tracker = UsageTracker()
    return _tracker
