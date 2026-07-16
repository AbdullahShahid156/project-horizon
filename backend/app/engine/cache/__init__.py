import time
from typing import Any
from dataclasses import dataclass, field


@dataclass
class CacheEntry:
    key: str
    value: Any
    created_at: float = field(default_factory=time.time)
    ttl_seconds: float = 3600.0

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > self.ttl_seconds

    @property
    def age_seconds(self) -> float:
        return time.time() - self.created_at


class AICache:
    """In-memory cache for AI generation results."""

    def __init__(self, default_ttl: float = 3600.0, max_size: int = 1000) -> None:
        self._cache: dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Any | None:
        entry = self._cache.get(key)
        if entry is None:
            self._misses += 1
            return None
        if entry.is_expired:
            del self._cache[key]
            self._misses += 1
            return None
        self._hits += 1
        return entry.value

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        if len(self._cache) >= self._max_size:
            self._evict_expired()
            if len(self._cache) >= self._max_size:
                oldest_key = min(self._cache, key=lambda k: self._cache[k].created_at)
                del self._cache[oldest_key]

        self._cache[key] = CacheEntry(
            key=key,
            value=value,
            ttl_seconds=ttl or self._default_ttl,
        )

    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        return count

    def invalidate_pattern(self, pattern: str) -> int:
        import re
        keys_to_delete = [k for k in self._cache if re.match(pattern, k)]
        for key in keys_to_delete:
            del self._cache[key]
        return len(keys_to_delete)

    def stats(self) -> dict[str, Any]:
        total_requests = self._hits + self._misses
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total_requests * 100, 2) if total_requests > 0 else 0,
        }

    def _evict_expired(self) -> None:
        expired_keys = [k for k, v in self._cache.items() if v.is_expired]
        for key in expired_keys:
            del self._cache[key]

    @staticmethod
    def make_key(*args: Any, **kwargs: Any) -> str:
        import hashlib
        import json
        parts = [str(a) for a in args]
        parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        raw = "|".join(parts)
        return hashlib.md5(raw.encode()).hexdigest()


_cache: AICache | None = None


def get_ai_cache() -> AICache:
    global _cache
    if _cache is None:
        _cache = AICache()
    return _cache
