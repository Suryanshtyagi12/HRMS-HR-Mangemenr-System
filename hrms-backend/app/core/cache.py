import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Basic in-memory fallback
_fallback_cache = {}

class CacheService:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        if key in _fallback_cache:
            return _fallback_cache[key]
        return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = 60):
        _fallback_cache[key] = value

    @staticmethod
    def delete(key: str):
        if key in _fallback_cache:
            del _fallback_cache[key]

    @staticmethod
    def delete_pattern(pattern: str):
        keys_to_delete = [k for k in _fallback_cache.keys() if pattern.replace('*', '') in k]
        for k in keys_to_delete:
            del _fallback_cache[k]

cache = CacheService()
