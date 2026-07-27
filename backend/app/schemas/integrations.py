from pydantic import BaseModel


class ProviderFieldResponse(BaseModel):
    key: str
    label: str
    type: str
    required: bool
    placeholder: str | None = None
    description: str | None = None


class IntegrationConnectRequest(BaseModel):
    workspace_id: str
    provider: str
    name: str
    credentials: dict[str, str]
    config: dict[str, str | bool | int | float] | None = None


class IntegrationUpdateRequest(BaseModel):
    name: str | None = None
    credentials: dict[str, str] | None = None
    config: dict[str, str | bool | int | float] | None = None
    auto_sync: bool | None = None
    sync_interval_minutes: int | None = None


class IntegrationSyncRequest(BaseModel):
    integration_id: str
    sync_type: str = "manual"
    force: bool = False


class IntegrationResponse(BaseModel):
    id: str
    workspace_id: str
    provider: str
    name: str
    status: str
    health_status: str
    config: dict[str, str | bool | int | float] | None = None
    auto_sync: bool
    sync_interval_minutes: int
    last_sync_at: str | None = None
    last_sync_status: str | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


class IntegrationLogResponse(BaseModel):
    id: str
    integration_id: str
    action: str
    status: str
    message: str | None = None
    details: dict[str, str | int | float | bool] | None = None
    duration_ms: float | None = None
    created_at: str


class SyncJobResponse(BaseModel):
    id: str
    integration_id: str
    sync_type: str
    status: str
    items_synced: int
    items_failed: int
    error_message: str | None = None
    started_at: str
    completed_at: str | None = None
    duration_ms: float | None = None


class ProviderResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    icon_url: str | None = None
    color: str
    fields: list[ProviderFieldResponse]
    is_available: bool = True


class IntegrationStatsResponse(BaseModel):
    total: int
    connected: int
    failed: int
    syncing: int
    by_category: dict[str, int]
    by_provider: dict[str, int]
    recent_syncs: int
    failed_syncs: int


class IntegrationPaginatedResponse(BaseModel):
    items: list[IntegrationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SyncedItemResponse(BaseModel):
    id: str
    integration_id: str
    external_id: str
    item_type: str
    title: str
    summary: str | None = None
    url: str | None = None
    metadata: dict[str, str | int | float | bool | list[str]] | None = None
    last_synced_at: str
    created_at: str


class SyncedItemPaginatedResponse(BaseModel):
    items: list[SyncedItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PushContentRequest(BaseModel):
    integration_id: str
    item_type: str
    title: str
    content: str
    metadata: dict[str, str | int | float | bool | list[str]] | None = None


class PushContentResponse(BaseModel):
    success: bool
    external_id: str | None = None
    url: str | None = None
    message: str
    provider: str
    latency_ms: float
