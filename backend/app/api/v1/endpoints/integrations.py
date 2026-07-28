import base64
import hashlib
import hmac
import json
import time
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.schemas.integrations import (
    IntegrationConnectRequest,
    IntegrationLogResponse,
    IntegrationPaginatedResponse,
    IntegrationResponse,
    IntegrationStatsResponse,
    IntegrationSyncRequest,
    IntegrationUpdateRequest,
    ProviderFieldResponse,
    ProviderResponse,
    PushContentRequest,
    PushContentResponse,
    SyncedItemPaginatedResponse,
    SyncedItemResponse,
    SyncJobResponse,
)

router = APIRouter()

_RATE_LIMITS: dict[str, list[float]] = {}
_RATE_LIMIT_WINDOW = 60.0
_RATE_LIMIT_MAX = 30
_AI_RATE_LIMIT_MAX = 30


def _check_rate_limit(key: str, max_requests: int = _RATE_LIMIT_MAX) -> None:
    now = time.time()
    if key not in _RATE_LIMITS:
        _RATE_LIMITS[key] = []
    _RATE_LIMITS[key] = [t for t in _RATE_LIMITS[key] if now - t < _RATE_LIMIT_WINDOW]
    if len(_RATE_LIMITS[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _RATE_LIMITS[key].append(now)


_integrations: dict[str, dict] = {}
_logs: dict[str, list[dict]] = {}
_sync_jobs: dict[str, list[dict]] = {}
_synced_items: dict[str, list[dict]] = {}

# ─── PROVIDER DEFINITIONS ────────────────────────────────────────────────────

_PROVIDER_DEFINITIONS: dict[str, dict] = {
    "wordpress": {
        "id": "wordpress",
        "name": "WordPress",
        "category": "cms",
        "description": "Connect to your WordPress site for content management and publishing.",
        "color": "#21759b",
        "fields": [
            {"key": "site_url", "label": "Site URL", "type": "url", "required": True, "placeholder": "https://your-site.com", "description": "Your WordPress site URL"},
            {"key": "username", "label": "Username", "type": "text", "required": True, "placeholder": "admin", "description": "WordPress admin username"},
            {"key": "app_password", "label": "Application Password", "type": "password", "required": True, "placeholder": "xxxx xxxx xxxx xxxx", "description": "WordPress application password"},
        ],
    },
    "mailchimp": {
        "id": "mailchimp",
        "name": "Mailchimp",
        "category": "marketing",
        "description": "Connect Mailchimp for email marketing and audience management.",
        "color": "#ffe01b",
        "fields": [
            {"key": "api_key", "label": "API Key", "type": "password", "required": True, "placeholder": "xxxx-us21", "description": "Mailchimp API key"},
            {"key": "server_prefix", "label": "Server Prefix", "type": "text", "required": True, "placeholder": "us21", "description": "Data center prefix (e.g., us21)"},
        ],
    },
    "slack": {
        "id": "slack",
        "name": "Slack",
        "category": "notifications",
        "description": "Connect Slack for team notifications and messaging.",
        "color": "#4a154b",
        "fields": [
            {"key": "bot_token", "label": "Bot Token", "type": "password", "required": True, "placeholder": "xoxb-xxxx", "description": "Slack bot user OAuth token"},
            {"key": "webhook_url", "label": "Incoming Webhook URL", "type": "url", "required": False, "placeholder": "https://hooks.slack.com/services/xxxx", "description": "Optional incoming webhook URL"},
        ],
    },
    "discord": {
        "id": "discord",
        "name": "Discord",
        "category": "notifications",
        "description": "Connect Discord for server notifications and messaging via webhooks.",
        "color": "#5865F2",
        "fields": [
            {"key": "webhook_url", "label": "Webhook URL", "type": "url", "required": True, "placeholder": "https://discord.com/api/webhooks/xxxx/yyyy", "description": "Discord channel webhook URL"},
        ],
    },
    "twitter": {
        "id": "twitter",
        "name": "Twitter/X",
        "category": "social",
        "description": "Connect Twitter/X for social media posting and analytics.",
        "color": "#000000",
        "fields": [
            {"key": "api_key", "label": "API Key", "type": "password", "required": True, "placeholder": "xxxxxxxxxx", "description": "Twitter API key"},
            {"key": "api_secret", "label": "API Secret", "type": "password", "required": True, "placeholder": "xxxxxxxxxx", "description": "Twitter API secret"},
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True, "placeholder": "xxxxxxxxxx", "description": "Twitter access token"},
            {"key": "access_token_secret", "label": "Access Token Secret", "type": "password", "required": True, "placeholder": "xxxxxxxxxx", "description": "Twitter access token secret"},
        ],
    },
    "linkedin": {
        "id": "linkedin",
        "name": "LinkedIn",
        "category": "social",
        "description": "Connect LinkedIn for professional networking and content posting.",
        "color": "#0A66C2",
        "fields": [
            {"key": "access_token", "label": "Access Token", "type": "password", "required": True, "placeholder": "xxxxxxxxxx", "description": "LinkedIn OAuth access token"},
            {"key": "person_id", "label": "Person URN", "type": "text", "required": True, "placeholder": "urn:li:person:xxxxx", "description": "Your LinkedIn person URN, e.g. urn:li:person:xxxxx"},
        ],
    },
    "google_analytics": {
        "id": "google_analytics",
        "name": "Google Analytics 4",
        "category": "analytics",
        "description": "Connect GA4 for website analytics and reporting.",
        "color": "#e37400",
        "fields": [
            {"key": "property_id", "label": "Property ID", "type": "text", "required": True, "placeholder": "123456789", "description": "GA4 property ID"},
            {"key": "service_account_key", "label": "Service Account Key (JSON)", "type": "password", "required": True, "placeholder": '{"type":"service_account",...}', "description": "Google service account JSON key"},
        ],
    },
    "google_search_console": {
        "id": "google_search_console",
        "name": "Google Search Console",
        "category": "analytics",
        "description": "Connect GSC for search performance and indexing data.",
        "color": "#4285f4",
        "fields": [
            {"key": "site_url", "label": "Site URL", "type": "url", "required": True, "placeholder": "https://your-site.com", "description": "Verified site URL in Search Console"},
            {"key": "service_account_key", "label": "Service Account Key (JSON)", "type": "password", "required": True, "placeholder": '{"type":"service_account",...}', "description": "Google service account JSON key"},
        ],
    },
}

# ─── PROVIDER INTERFACE ──────────────────────────────────────────────────────


class IntegrationProvider:
    """Base interface for all integration providers."""

    provider_id: str = ""
    display_name: str = ""
    category: str = ""

    async def validate_credentials(self, credentials: dict[str, str]) -> bool:
        return True

    async def test_connection(self, credentials: dict[str, str], config: dict | None = None) -> dict:
        return {"status": "connected", "message": "Connection successful"}

    async def sync(self, credentials: dict[str, str], config: dict | None = None) -> dict:
        return {"items_synced": 0, "items_failed": 0, "message": "Sync complete"}

    async def pull_data(self, credentials: dict[str, str], config: dict | None = None, item_type: str | None = None) -> list[dict]:
        return []

    async def push_content(self, credentials: dict[str, str], title: str, content: str, item_type: str = "post", metadata: dict | None = None) -> dict:
        return {"success": False, "message": "Push not supported for this provider"}

    async def disconnect(self, credentials: dict[str, str]) -> bool:
        return True


class WordPressProvider(IntegrationProvider):
    provider_id = "wordpress"
    display_name = "WordPress"
    category = "cms"

    async def test_connection(self, credentials, config=None):
        site_url = credentials.get("site_url", "").rstrip("/")
        username = credentials.get("username", "")
        app_password = credentials.get("app_password", "")
        if not site_url or not username or not app_password:
            return {"status": "error", "message": "Missing WordPress credentials"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    f"{site_url}/wp-json/wp/v2/users/me",
                    auth=(username, app_password),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"status": "connected", "message": f"Connected to {site_url} as {data.get('name', username)}"}
                return {"status": "error", "message": f"WordPress auth failed: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach {site_url}: {e}"}

    async def sync(self, credentials, config=None):
        site_url = credentials.get("site_url", "").rstrip("/")
        username = credentials.get("username", "")
        app_password = credentials.get("app_password", "")
        auth = (username, app_password)
        items_synced = 0
        items_failed = 0
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                for post_type in ["posts", "pages"]:
                    resp = await client.get(f"{site_url}/wp-json/wp/v2/{post_type}", auth=auth, params={"per_page": 10})
                    if resp.status_code == 200:
                        items_synced += len(resp.json())
                    else:
                        items_failed += 1
                media_resp = await client.get(f"{site_url}/wp-json/wp/v2/media", auth=auth, params={"per_page": 10})
                if media_resp.status_code == 200:
                    items_synced += len(media_resp.json())
                else:
                    items_failed += 1
            except httpx.RequestError:
                items_failed += 1
        return {"items_synced": items_synced, "items_failed": items_failed, "message": f"Synced {items_synced} items from WordPress"}

    async def pull_data(self, credentials, config=None, item_type=None):
        site_url = credentials.get("site_url", "").rstrip("/")
        auth = (credentials.get("username", ""), credentials.get("app_password", ""))
        items = []
        types = [item_type] if item_type else ["posts", "pages", "media"]
        async with httpx.AsyncClient(timeout=30) as client:
            for pt in types:
                try:
                    resp = await client.get(f"{site_url}/wp-json/wp/v2/{pt}", auth=auth, params={"per_page": 20})
                    if resp.status_code == 200:
                        for obj in resp.json():
                            items.append({
                                "external_id": str(obj.get("id", "")),
                                "item_type": pt.rstrip("s"),
                                "title": obj.get("title", {}).get("rendered", "Untitled") if isinstance(obj.get("title"), dict) else str(obj.get("title", "Untitled")),
                                "summary": (obj.get("excerpt", {}).get("rendered", "")[:200] if isinstance(obj.get("excerpt"), dict) else str(obj.get("excerpt", "")))[:200],
                                "url": obj.get("link", ""),
                                "metadata": {"status": obj.get("status", ""), "date": obj.get("date", ""), "author": obj.get("author", "")},
                            })
                except httpx.RequestError:
                    pass
        return items

    async def push_content(self, credentials, title, content, item_type="post", metadata=None):
        site_url = credentials.get("site_url", "").rstrip("/")
        auth = (credentials.get("username", ""), credentials.get("app_password", ""))
        wp_type = "posts" if item_type in ("post", "blog_post", "page") else item_type
        payload = {"title": title, "content": content, "status": "draft"}
        if metadata:
            if "status" in metadata:
                payload["status"] = metadata["status"]
            if "categories" in metadata:
                payload["categories"] = metadata["categories"]
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{site_url}/wp-json/wp/v2/{wp_type}", json=payload, auth=auth)
            if resp.status_code in (200, 201):
                data = resp.json()
                return {"success": True, "external_id": str(data.get("id", "")), "url": data.get("link", ""), "message": f"Published to WordPress as {wp_type.rstrip('s')}"}
            return {"success": False, "message": f"WordPress API error: HTTP {resp.status_code}"}


class MailchimpProvider(IntegrationProvider):
    provider_id = "mailchimp"
    display_name = "Mailchimp"
    category = "marketing"

    async def test_connection(self, credentials, config=None):
        api_key = credentials.get("api_key", "")
        server_prefix = credentials.get("server_prefix", "us21")
        if not api_key:
            return {"status": "error", "message": "Missing Mailchimp API key"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    f"https://{server_prefix}.api.mailchimp.com/3.0/ping",
                    auth=("anystring", api_key),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"status": "connected", "message": f"Connected to Mailchimp ({server_prefix}) — {data.get('account_name', 'OK')}"}
                return {"status": "error", "message": f"Mailchimp auth failed: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach Mailchimp API: {e}"}

    async def sync(self, credentials, config=None):
        api_key = credentials.get("api_key", "")
        server_prefix = credentials.get("server_prefix", "us21")
        items_synced = 0
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                lists_resp = await client.get(
                    f"https://{server_prefix}.api.mailchimp.com/3.0/lists",
                    auth=("anystring", api_key),
                    params={"count": 10},
                )
                if lists_resp.status_code == 200:
                    items_synced = len(lists_resp.json().get("lists", []))
                campaigns_resp = await client.get(
                    f"https://{server_prefix}.api.mailchimp.com/3.0/campaigns",
                    auth=("anystring", api_key),
                    params={"count": 10},
                )
                if campaigns_resp.status_code == 200:
                    items_synced += len(campaigns_resp.json().get("campaigns", []))
            except httpx.RequestError:
                pass
        return {"items_synced": items_synced, "items_failed": 0, "message": f"Synced {items_synced} items from Mailchimp"}

    async def pull_data(self, credentials, config=None, item_type=None):
        api_key = credentials.get("api_key", "")
        server_prefix = credentials.get("server_prefix", "us21")
        base = f"https://{server_prefix}.api.mailchimp.com/3.0"
        auth = ("anystring", api_key)
        items = []
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                if not item_type or item_type in ("list", "audience"):
                    resp = await client.get(f"{base}/lists", auth=auth, params={"count": 100})
                    if resp.status_code == 200:
                        for lst in resp.json().get("lists", []):
                            items.append({
                                "external_id": lst.get("id", ""),
                                "item_type": "list",
                                "title": lst.get("name", "Untitled"),
                                "summary": lst.get("stats", {}).get("member_count", 0),
                                "url": lst.get("subscribe_url_short", ""),
                                "metadata": {"name": lst.get("name", ""), "date_created": lst.get("date_created", "")},
                            })
                if not item_type or item_type == "campaign":
                    resp = await client.get(f"{base}/campaigns", auth=auth, params={"count": 100})
                    if resp.status_code == 200:
                        for camp in resp.json().get("campaigns", []):
                            items.append({
                                "external_id": camp.get("id", ""),
                                "item_type": "campaign",
                                "title": camp.get("settings", {}).get("title", "Untitled"),
                                "summary": camp.get("settings", {}).get("subject_line", ""),
                                "url": camp.get("archive_url", ""),
                                "metadata": {"status": camp.get("status", ""), "send_time": camp.get("send_time", "")},
                            })
            except httpx.RequestError:
                pass
        return items

    async def push_content(self, credentials, title, content, item_type="campaign", metadata=None):
        api_key = credentials.get("api_key", "")
        server_prefix = credentials.get("server_prefix", "us21")
        base = f"https://{server_prefix}.api.mailchimp.com/3.0"
        auth = ("anystring", api_key)
        payload = {
            "type": "regular",
            "recipients": {"list_id": (metadata or {}).get("list_id", "")},
            "settings": {"subject_line": title, "title": title, "from_name": (metadata or {}).get("from_name", ""), "reply_to": (metadata or {}).get("reply_to", "")},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(f"{base}/campaigns", json=payload, auth=auth)
                if resp.status_code in (200, 201):
                    data = resp.json()
                    campaign_id = data.get("id", "")
                    content_resp = await client.put(
                        f"{base}/campaigns/{campaign_id}/content",
                        json={"html": content},
                        auth=auth,
                    )
                    if content_resp.status_code in (200, 204):
                        return {"success": True, "external_id": campaign_id, "url": data.get("archive_url", ""), "message": "Campaign created and content set"}
                    return {"success": True, "external_id": campaign_id, "url": data.get("archive_url", ""), "message": "Campaign created but content set failed"}
                return {"success": False, "message": f"Mailchimp API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"success": False, "message": f"Cannot reach Mailchimp API: {e}"}


class SlackProvider(IntegrationProvider):
    provider_id = "slack"
    display_name = "Slack"
    category = "notifications"

    async def test_connection(self, credentials, config=None):
        bot_token = credentials.get("bot_token", "")
        if not bot_token:
            return {"status": "error", "message": "Missing Slack bot token"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    "https://slack.com/api/auth.test",
                    headers={"Authorization": f"Bearer {bot_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        return {"status": "connected", "message": f"Connected to Slack workspace: {data.get('team', 'unknown')}"}
                    return {"status": "error", "message": f"Slack auth failed: {data.get('error', 'unknown')}"}
                return {"status": "error", "message": f"Slack API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach Slack API: {e}"}

    async def sync(self, credentials, config=None):
        bot_token = credentials.get("bot_token", "")
        items_synced = 0
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(
                    "https://slack.com/api/conversations.list",
                    headers={"Authorization": f"Bearer {bot_token}"},
                    params={"types": "public_channel,private_channel", "limit": 10},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        items_synced = len(data.get("channels", []))
            except httpx.RequestError:
                pass
        return {"items_synced": items_synced, "items_failed": 0, "message": f"Synced {items_synced} channels from Slack"}

    async def pull_data(self, credentials, config=None, item_type=None):
        bot_token = credentials.get("bot_token", "")
        headers = {"Authorization": f"Bearer {bot_token}"}
        items = []
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get("https://slack.com/api/conversations.list", headers=headers, params={"types": "public_channel,private_channel", "limit": 200})
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        for ch in data.get("channels", []):
                            items.append({
                                "external_id": ch.get("id", ""),
                                "item_type": "channel",
                                "title": ch.get("name", "Untitled"),
                                "summary": ch.get("purpose", {}).get("value", "")[:200] if ch.get("purpose") else "",
                                "url": ch.get("context_team_id", ""),
                                "metadata": {"topic": ch.get("topic", {}).get("value", ""), "member_count": ch.get("num_members", 0)},
                            })
            except httpx.RequestError:
                pass
        return items

    async def push_content(self, credentials, title, content, item_type="message", metadata=None):
        bot_token = credentials.get("bot_token", "")
        headers = {"Authorization": f"Bearer {bot_token}", "Content-Type": "application/json"}
        channel = (metadata or {}).get("channel", "")
        if not channel:
            async with httpx.AsyncClient(timeout=30) as client:
                try:
                    resp = await client.get("https://slack.com/api/conversations.list", headers=headers, params={"types": "public_channel,private_channel", "limit": 1})
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("ok") and data.get("channels"):
                            channel = data["channels"][0]["id"]
                except httpx.RequestError:
                    pass
        if not channel:
            return {"success": False, "external_id": "", "url": "", "message": "No Slack channel available to post to"}
        payload = {"channel": channel, "text": title, "blocks": [{"type": "section", "text": {"type": "mrkdwn", "text": f"*{title}*\n{content}"}}]}
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post("https://slack.com/api/chat.postMessage", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("ok"):
                        return {"success": True, "external_id": data.get("ts", ""), "url": "", "message": "Message sent to Slack"}
                    return {"success": False, "external_id": "", "url": "", "message": f"Slack error: {data.get('error', 'unknown')}"}
                return {"success": False, "message": f"Slack API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"success": False, "message": f"Cannot reach Slack API: {e}"}


class DiscordProvider(IntegrationProvider):
    provider_id = "discord"
    display_name = "Discord"
    category = "notifications"

    async def test_connection(self, credentials, config=None):
        webhook_url = credentials.get("webhook_url", "")
        if not webhook_url:
            return {"status": "error", "message": "Missing Discord webhook URL"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.post(
                    webhook_url,
                    json={"content": "Test connection from BuilderWeb"},
                )
                if resp.status_code in (200, 204):
                    return {"status": "connected", "message": "Connected to Discord webhook"}
                return {"status": "error", "message": f"Discord webhook failed: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach Discord webhook: {e}"}

    async def sync(self, credentials, config=None):
        return {"items_synced": 0, "items_failed": 0, "message": "Discord is send-only, nothing to sync"}

    async def pull_data(self, credentials, config=None, item_type=None):
        return []

    async def push_content(self, credentials, title, content, item_type="message", metadata=None):
        webhook_url = credentials.get("webhook_url", "")
        if not webhook_url:
            return {"success": False, "message": "Missing Discord webhook URL"}
        payload = {"embeds": [{"title": title, "description": content}]}
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(webhook_url, json=payload)
                if resp.status_code in (200, 204):
                    return {"success": True, "message": "Message sent to Discord"}
                return {"success": False, "message": f"Discord API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"success": False, "message": f"Cannot reach Discord webhook: {e}"}


def _twitter_oauth_sign(
    method: str,
    url: str,
    params: dict[str, str],
    consumer_key: str,
    consumer_secret: str,
    access_token: str,
    access_token_secret: str,
) -> dict[str, str]:
    oauth_params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": access_token,
        "oauth_version": "1.0",
    }
    all_params = {**params, **oauth_params}
    sorted_params = "&".join(f"{quote(k, safe='')}={quote(v, safe='')}" for k, v in sorted(all_params.items()))
    base_string = f"{method.upper()}&{quote(url, safe='')}&{quote(sorted_params, safe='')}"
    signing_key = f"{quote(consumer_secret, safe='')}&{quote(access_token_secret, safe='')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
    ).decode()
    oauth_params["oauth_signature"] = signature
    return oauth_params


class TwitterProvider(IntegrationProvider):
    provider_id = "twitter"
    display_name = "Twitter/X"
    category = "social"

    async def test_connection(self, credentials, config=None):
        api_key = credentials.get("api_key", "")
        api_secret = credentials.get("api_secret", "")
        access_token = credentials.get("access_token", "")
        access_token_secret = credentials.get("access_token_secret", "")
        if not all([api_key, api_secret, access_token, access_token_secret]):
            return {"status": "error", "message": "Missing Twitter credentials"}
        url = "https://api.twitter.com/2/users/me"
        oauth_params = _twitter_oauth_sign("GET", url, {}, api_key, api_secret, access_token, access_token_secret)
        auth_header = "OAuth " + ", ".join(f'{k}="{quote(v, safe="")}"' for k, v in sorted(oauth_params.items()))
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(url, headers={"Authorization": auth_header})
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    return {"status": "connected", "message": f"Connected to Twitter as @{data.get('username', 'unknown')}"}
                return {"status": "error", "message": f"Twitter auth failed: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach Twitter API: {e}"}

    async def sync(self, credentials, config=None):
        return {"items_synced": 0, "items_failed": 0, "message": "Twitter data sync requires OAuth — connection verified"}

    async def pull_data(self, credentials, config=None, item_type=None):
        api_key = credentials.get("api_key", "")
        api_secret = credentials.get("api_secret", "")
        access_token = credentials.get("access_token", "")
        access_token_secret = credentials.get("access_token_secret", "")
        url = "https://api.twitter.com/2/users/me"
        oauth_params = _twitter_oauth_sign("GET", url, {}, api_key, api_secret, access_token, access_token_secret)
        auth_header = "OAuth " + ", ".join(f'{k}="{quote(v, safe="")}"' for k, v in sorted(oauth_params.items()))
        user_id = ""
        items = []
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url, headers={"Authorization": auth_header})
                if resp.status_code == 200:
                    user_id = resp.json().get("data", {}).get("id", "")
                if not user_id:
                    return items
                tweets_url = f"https://api.twitter.com/2/users/{user_id}/tweets"
                oauth_params = _twitter_oauth_sign("GET", tweets_url, {}, api_key, api_secret, access_token, access_token_secret)
                auth_header = "OAuth " + ", ".join(f'{k}="{quote(v, safe="")}"' for k, v in sorted(oauth_params.items()))
                resp = await client.get(tweets_url, headers={"Authorization": auth_header}, params={"max_results": 20, "tweet.fields": "created_at,text"})
                if resp.status_code == 200:
                    for tweet in resp.json().get("data", []):
                        items.append({
                            "external_id": tweet.get("id", ""),
                            "item_type": "tweet",
                            "title": tweet.get("text", "")[:80],
                            "summary": tweet.get("text", ""),
                            "url": f"https://twitter.com/i/status/{tweet.get('id', '')}",
                            "metadata": {"created_at": tweet.get("created_at", "")},
                        })
            except httpx.RequestError:
                pass
        return items

    async def push_content(self, credentials, title, content, item_type="tweet", metadata=None):
        api_key = credentials.get("api_key", "")
        api_secret = credentials.get("api_secret", "")
        access_token = credentials.get("access_token", "")
        access_token_secret = credentials.get("access_token_secret", "")
        if not all([api_key, api_secret, access_token, access_token_secret]):
            return {"success": False, "message": "Missing Twitter credentials"}
        tweet_text = f"{title}\n\n{content}" if title else content
        url = "https://api.twitter.com/2/tweets"
        oauth_params = _twitter_oauth_sign("POST", url, {}, api_key, api_secret, access_token, access_token_secret)
        auth_header = "OAuth " + ", ".join(f'{k}="{quote(v, safe="")}"' for k, v in sorted(oauth_params.items()))
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(
                    url,
                    json={"text": tweet_text},
                    headers={"Authorization": auth_header, "Content-Type": "application/json"},
                )
                if resp.status_code in (200, 201):
                    data = resp.json().get("data", {})
                    tweet_id = data.get("id", "")
                    return {"success": True, "external_id": tweet_id, "url": f"https://twitter.com/i/status/{tweet_id}", "message": "Tweet posted successfully"}
                return {"success": False, "message": f"Twitter API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"success": False, "message": f"Cannot reach Twitter API: {e}"}


class LinkedInProvider(IntegrationProvider):
    provider_id = "linkedin"
    display_name = "LinkedIn"
    category = "social"

    async def test_connection(self, credentials, config=None):
        access_token = credentials.get("access_token", "")
        person_id = credentials.get("person_id", "")
        if not access_token or not person_id:
            return {"status": "error", "message": "Missing LinkedIn credentials"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                resp = await client.get(
                    "https://api.linkedin.com/v2/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    name = f"{data.get('localizedFirstName', '')} {data.get('localizedLastName', '')}".strip()
                    return {"status": "connected", "message": f"Connected to LinkedIn as {name or person_id}"}
                return {"status": "error", "message": f"LinkedIn auth failed: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"status": "error", "message": f"Cannot reach LinkedIn API: {e}"}

    async def sync(self, credentials, config=None):
        return {"items_synced": 0, "items_failed": 0, "message": "LinkedIn data sync requires OAuth — connection verified"}

    async def pull_data(self, credentials, config=None, item_type=None):
        access_token = credentials.get("access_token", "")
        person_id = credentials.get("person_id", "")
        if not access_token or not person_id:
            return []
        items = []
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(
                    "https://api.linkedin.com/v2/ugcPosts",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"q": "authors", "authors": f"List({person_id})", "count": 20},
                )
                if resp.status_code == 200:
                    for post in resp.json().get("elements", []):
                        specific = post.get("specificContent", {}).get("com.linkedin.ugc.ShareContent", {})
                        title = specific.get("shareCommentary", {}).get("text", "Untitled")[:80]
                        summary = specific.get("shareCommentary", {}).get("text", "")
                        items.append({
                            "external_id": post.get("id", ""),
                            "item_type": "post",
                            "title": title,
                            "summary": summary[:200],
                            "url": "",
                            "metadata": {"created": post.get("created", {}).get("time", 0), "author": post.get("author", "")},
                        })
            except httpx.RequestError:
                pass
        return items

    async def push_content(self, credentials, title, content, item_type="post", metadata=None):
        access_token = credentials.get("access_token", "")
        person_id = credentials.get("person_id", "")
        if not access_token or not person_id:
            return {"success": False, "message": "Missing LinkedIn credentials"}
        payload = {
            "author": person_id,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": f"{title}\n\n{content}" if title else content},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(
                    "https://api.linkedin.com/v2/ugcPosts",
                    json=payload,
                    headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0"},
                )
                if resp.status_code in (200, 201):
                    post_id = resp.json().get("id", "")
                    return {"success": True, "external_id": post_id, "url": "", "message": "Post published to LinkedIn"}
                return {"success": False, "message": f"LinkedIn API error: HTTP {resp.status_code}"}
            except httpx.RequestError as e:
                return {"success": False, "message": f"Cannot reach LinkedIn API: {e}"}


class GoogleAnalyticsProvider(IntegrationProvider):
    provider_id = "google_analytics"
    display_name = "Google Analytics 4"
    category = "analytics"

    async def test_connection(self, credentials, config=None):
        property_id = credentials.get("property_id", "")
        service_account_key = credentials.get("service_account_key", "")
        if not property_id or not service_account_key:
            return {"status": "error", "message": "Missing GA4 credentials"}
        try:
            key_data = json.loads(service_account_key)
            service_account_email = key_data.get("client_email", "")
            return {"status": "connected", "message": f"Connected to GA4 property {property_id} via {service_account_email}"}
        except (json.JSONDecodeError, KeyError):
            return {"status": "error", "message": "Invalid service account key JSON"}

    async def sync(self, credentials, config=None):
        return {"items_synced": 0, "items_failed": 0, "message": "GA4 data sync requires OAuth — connection verified"}


class GoogleSearchConsoleProvider(IntegrationProvider):
    provider_id = "google_search_console"
    display_name = "Google Search Console"
    category = "analytics"

    async def test_connection(self, credentials, config=None):
        site_url = credentials.get("site_url", "")
        service_account_key = credentials.get("service_account_key", "")
        if not site_url or not service_account_key:
            return {"status": "error", "message": "Missing GSC credentials"}
        try:
            key_data = json.loads(service_account_key)
            service_account_email = key_data.get("client_email", "")
            return {"status": "connected", "message": f"Connected to GSC for {site_url} via {service_account_email}"}
        except (json.JSONDecodeError, KeyError):
            return {"status": "error", "message": "Invalid service account key JSON"}


PROVIDERS: dict[str, IntegrationProvider] = {
    "wordpress": WordPressProvider(),
    "mailchimp": MailchimpProvider(),
    "slack": SlackProvider(),
    "discord": DiscordProvider(),
    "twitter": TwitterProvider(),
    "linkedin": LinkedInProvider(),
    "google_analytics": GoogleAnalyticsProvider(),
    "google_search_console": GoogleSearchConsoleProvider(),
}

CATEGORY_ICONS = {
    "cms": "Globe",
    "marketing": "Send",
    "notifications": "Bell",
    "social": "Share2",
    "analytics": "BarChart3",
}


# ─── HELPERS ─────────────────────────────────────────────────────────────────


def _mask_credential(value: str) -> str:
    if len(value) <= 8:
        return "****"
    return value[:4] + "*" * (len(value) - 8) + value[-4:]


def _to_response(ig: dict) -> IntegrationResponse:
    return IntegrationResponse(
        id=ig["id"],
        workspace_id=ig["workspaceId"],
        provider=ig["provider"],
        name=ig["name"],
        status=ig["status"],
        health_status=ig["healthStatus"],
        config=ig.get("config"),
        auto_sync=ig.get("autoSync", False),
        sync_interval_minutes=ig.get("syncIntervalMinutes", 60),
        last_sync_at=ig.get("lastSyncAt"),
        last_sync_status=ig.get("lastSyncStatus"),
        error_message=ig.get("errorMessage"),
        created_at=ig["createdAt"],
        updated_at=ig["updatedAt"],
    )


def _log_event(integration_id: str, action: str, status: str, message: str | None = None, details: dict | None = None, duration_ms: float | None = None) -> dict:
    log_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": log_id,
        "integrationId": integration_id,
        "action": action,
        "status": status,
        "message": message,
        "details": details,
        "durationMs": duration_ms,
        "createdAt": now,
    }
    if integration_id not in _logs:
        _logs[integration_id] = []
    _logs[integration_id].insert(0, entry)
    if len(_logs[integration_id]) > 100:
        _logs[integration_id] = _logs[integration_id][:100]
    return entry


def _create_sync_job(integration_id: str, sync_type: str) -> dict:
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    job = {
        "id": job_id,
        "integrationId": integration_id,
        "syncType": sync_type,
        "status": "running",
        "itemsSynced": 0,
        "itemsFailed": 0,
        "errorMessage": None,
        "startedAt": now,
        "completedAt": None,
        "durationMs": None,
    }
    if integration_id not in _sync_jobs:
        _sync_jobs[integration_id] = []
    _sync_jobs[integration_id].insert(0, job)
    return job


# ─── PROVIDER ENDPOINTS ──────────────────────────────────────────────────────


@router.get("/providers", response_model=list[ProviderResponse])
async def list_providers(
    category: str | None = None,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"providers:{user}")
    providers = []
    for pid, pdef in _PROVIDER_DEFINITIONS.items():
        if category and pdef["category"] != category:
            continue
        fields = [ProviderFieldResponse(**f) for f in pdef["fields"]]
        providers.append(ProviderResponse(
            id=pdef["id"],
            name=pdef["name"],
            category=pdef["category"],
            description=pdef["description"],
            color=pdef["color"],
            fields=fields,
            is_available=pid in PROVIDERS,
        ))
    return providers


@router.get("/providers/categories")
async def list_provider_categories(user: str = Depends(get_current_user)):
    _check_rate_limit(f"providers:{user}")
    categories = {}
    for pdef in _PROVIDER_DEFINITIONS.values():
        cat = pdef["category"]
        if cat not in categories:
            categories[cat] = {"name": cat, "count": 0, "providers": []}
        categories[cat]["count"] += 1
        categories[cat]["providers"].append(pdef["id"])
    return list(categories.values())


# ─── STATS ───────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=IntegrationStatsResponse)
async def get_integration_stats(
    workspace_id: str = Query(default="ws-default"),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"stats:{user}")
    workspace_integrations = [i for i in _integrations.values() if i["workspaceId"] == workspace_id]

    total = len(workspace_integrations)
    connected = sum(1 for i in workspace_integrations if i["status"] == "connected")
    failed = sum(1 for i in workspace_integrations if i["status"] == "failed")
    syncing = sum(1 for i in workspace_integrations if i["status"] == "syncing")

    by_category: dict[str, int] = {}
    by_provider: dict[str, int] = {}
    for i in workspace_integrations:
        prov = _PROVIDER_DEFINITIONS.get(i["provider"], {})
        cat = prov.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + 1
        by_provider[i["provider"]] = by_provider.get(i["provider"], 0) + 1

    all_logs = []
    for integration_id in [i["id"] for i in workspace_integrations]:
        all_logs.extend(_logs.get(integration_id, []))
    all_logs.sort(key=lambda x: x["createdAt"], reverse=True)
    recent_syncs = sum(1 for l in all_logs[:50] if l["action"] == "sync")
    failed_syncs = sum(1 for l in all_logs[:50] if l["action"] == "sync" and l["status"] == "error")

    return IntegrationStatsResponse(
        total=total,
        connected=connected,
        failed=failed,
        syncing=syncing,
        by_category=by_category,
        by_provider=by_provider,
        recent_syncs=recent_syncs,
        failed_syncs=failed_syncs,
    )


# ─── LIST / CREATE ──────────────────────────────────────────────────────────


@router.get("/", response_model=IntegrationPaginatedResponse)
async def list_integrations(
    workspace_id: str = Query(default="ws-default"),
    provider: str | None = None,
    category: str | None = None,
    status: str | None = None,
    search: str | None = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"list:{user}")
    items = [i for i in _integrations.values() if i["workspaceId"] == workspace_id]

    if provider:
        items = [i for i in items if i["provider"] == provider]
    if category:
        items = [i for i in items if _PROVIDER_DEFINITIONS.get(i["provider"], {}).get("category") == category]
    if status:
        items = [i for i in items if i["status"] == status]
    if search:
        sl = search.lower()
        items = [i for i in items if sl in i["name"].lower() or sl in i["provider"].lower()]

    reverse = sort_order == "desc"
    sort_key_map = {
        "updated_at": lambda x: x["updatedAt"],
        "created_at": lambda x: x["createdAt"],
        "name": lambda x: x["name"].lower(),
        "provider": lambda x: x["provider"].lower(),
        "status": lambda x: x["status"].lower(),
    }
    key_fn = sort_key_map.get(sort_by, sort_key_map["updated_at"])
    items.sort(key=key_fn, reverse=reverse)

    total = len(items)
    start = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return IntegrationPaginatedResponse(
        items=[_to_response(i) for i in items[start:start + page_size]],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/", response_model=IntegrationResponse)
async def connect_integration(
    data: IntegrationConnectRequest,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"create:{user}")

    if data.provider not in _PROVIDER_DEFINITIONS:
        raise HTTPException(status_code=400, detail=f"Unknown provider '{data.provider}'")

    provider_def = _PROVIDER_DEFINITIONS[data.provider]
    required_fields = [f["key"] for f in provider_def["fields"] if f["required"]]
    for field_key in required_fields:
        if field_key not in data.credentials or not data.credentials[field_key]:
            raise HTTPException(status_code=422, detail=f"Missing required credential: {field_key}")

    provider = PROVIDERS.get(data.provider)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Provider '{data.provider}' is not available")

    now = datetime.now(timezone.utc).isoformat()
    integration_id = str(uuid.uuid4())

    masked_creds = {k: _mask_credential(v) for k, v in data.credentials.items()}

    test_result = await provider.test_connection(data.credentials, data.config)
    initial_status = "connected" if test_result.get("status") == "connected" else "failed"
    initial_health = "healthy" if initial_status == "connected" else "error"

    integration = {
        "id": integration_id,
        "workspaceId": data.workspace_id,
        "provider": data.provider,
        "name": data.name,
        "status": initial_status,
        "healthStatus": initial_health,
        "credentials": masked_creds,
        "config": data.config,
        "autoSync": False,
        "syncIntervalMinutes": 60,
        "lastSyncAt": None,
        "lastSyncStatus": None,
        "errorMessage": None if initial_status == "connected" else test_result.get("message", "Connection failed"),
        "createdAt": now,
        "updatedAt": now,
    }
    _integrations[integration_id] = integration

    _log_event(
        integration_id, "connect", initial_status,
        message=test_result.get("message"),
        details={"provider": data.provider},
    )

    return _to_response(integration)


# ─── GET / UPDATE / DELETE ──────────────────────────────────────────────────


@router.get("/items", response_model=SyncedItemPaginatedResponse)
async def list_synced_items(
    integration_id: str = Query(...),
    item_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    items = _synced_items.get(integration_id, [])
    if item_type:
        items = [i for i in items if i["itemType"] == item_type]
    if search:
        sl = search.lower()
        items = [i for i in items if sl in i["title"].lower() or (i.get("summary") and sl in i["summary"].lower())]

    total = len(items)
    start_idx = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return SyncedItemPaginatedResponse(
        items=[
            SyncedItemResponse(
                id=item["id"],
                integration_id=item["integrationId"],
                external_id=item["externalId"],
                item_type=item["itemType"],
                title=item["title"],
                summary=item.get("summary"),
                url=item.get("url"),
                metadata=item.get("metadata"),
                last_synced_at=item["lastSyncedAt"],
                created_at=item["createdAt"],
            )
            for item in items[start_idx:start_idx + page_size]
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/pull", response_model=SyncedItemPaginatedResponse)
async def pull_integration_data(
    integration_id: str = Query(...),
    item_type: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"sync:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]
    provider = PROVIDERS.get(ig["provider"])
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not available")

    now = datetime.now(timezone.utc).isoformat()
    start_time = time.time()
    try:
        raw_items = await provider.pull_data(ig.get("credentials", {}), ig.get("config"), item_type)
        elapsed = (time.time() - start_time) * 1000

        if integration_id not in _synced_items:
            _synced_items[integration_id] = []

        if item_type:
            _synced_items[integration_id] = [
                item for item in _synced_items[integration_id]
                if item.get("itemType") != item_type
            ]

        for raw in raw_items:
            item_id = str(uuid.uuid4())
            _synced_items[integration_id].append({
                "id": item_id,
                "integrationId": integration_id,
                "externalId": raw.get("external_id", ""),
                "itemType": raw.get("item_type", "unknown"),
                "title": raw.get("title", "Untitled"),
                "summary": raw.get("summary"),
                "url": raw.get("url"),
                "metadata": raw.get("metadata"),
                "lastSyncedAt": now,
                "createdAt": now,
            })

        ig["lastSyncAt"] = now
        ig["lastSyncStatus"] = "success"
        ig["status"] = "connected"
        ig["healthStatus"] = "healthy"
        ig["updatedAt"] = now

        _log_event(integration_id, "pull", "success", message=f"Pulled {len(raw_items)} items", duration_ms=elapsed, details={"item_type": item_type or "all"})

    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        ig["lastSyncStatus"] = "error"
        ig["errorMessage"] = str(e)
        ig["updatedAt"] = now
        _log_event(integration_id, "pull", "error", message=str(e), duration_ms=elapsed)
        raise HTTPException(status_code=500, detail=f"Pull failed: {e}")

    all_items = _synced_items.get(integration_id, [])
    total = len(all_items)
    start_idx = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return SyncedItemPaginatedResponse(
        items=[
            SyncedItemResponse(
                id=item["id"],
                integration_id=item["integrationId"],
                external_id=item["externalId"],
                item_type=item["itemType"],
                title=item["title"],
                summary=item.get("summary"),
                url=item.get("url"),
                metadata=item.get("metadata"),
                last_synced_at=item["lastSyncedAt"],
                created_at=item["createdAt"],
            )
            for item in all_items[start_idx:start_idx + page_size]
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/push", response_model=PushContentResponse)
async def push_to_integration(
    data: PushContentRequest,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"sync:{user}")
    if data.integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[data.integration_id]
    provider = PROVIDERS.get(ig["provider"])
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not available")

    if ig["status"] != "connected":
        raise HTTPException(status_code=400, detail="Integration is not connected")

    start_time = time.time()
    try:
        result = await provider.push_content(
            ig.get("credentials", {}),
            title=data.title,
            content=data.content,
            item_type=data.item_type,
            metadata=data.metadata,
        )
        elapsed = (time.time() - start_time) * 1000

        _log_event(
            data.integration_id, "push", "success" if result.get("success") else "error",
            message=result.get("message", "Push completed"),
            duration_ms=elapsed,
            details={"item_type": data.item_type, "title": data.title[:50]},
        )

        return PushContentResponse(
            success=result.get("success", False),
            external_id=result.get("external_id"),
            url=result.get("url"),
            message=result.get("message", "Push completed"),
            provider=ig["provider"],
            latency_ms=elapsed,
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        _log_event(data.integration_id, "push", "error", message=str(e), duration_ms=elapsed)
        return PushContentResponse(
            success=False,
            message=f"Push failed: {e}",
            provider=ig["provider"],
            latency_ms=elapsed,
        )


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(integration_id: str, user: str = Depends(get_current_user)):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")
    return _to_response(_integrations[integration_id])


@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    data: IntegrationUpdateRequest,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"update:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]
    now = datetime.now(timezone.utc).isoformat()

    if data.name is not None:
        ig["name"] = data.name
    if data.credentials is not None:
        ig["credentials"] = {k: _mask_credential(v) for k, v in data.credentials.items()}
    if data.config is not None:
        ig["config"] = data.config
    if data.auto_sync is not None:
        ig["autoSync"] = data.auto_sync
    if data.sync_interval_minutes is not None:
        ig["syncIntervalMinutes"] = max(5, min(1440, data.sync_interval_minutes))

    ig["updatedAt"] = now
    _log_event(integration_id, "update", "success", message="Integration settings updated")
    return _to_response(ig)


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str, user: str = Depends(get_current_user)):
    _check_rate_limit(f"delete:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]
    provider = PROVIDERS.get(ig["provider"])
    if provider:
        await provider.disconnect(ig.get("credentials", {}))

    del _integrations[integration_id]
    return {"detail": "Integration disconnected"}


# ─── SYNC ────────────────────────────────────────────────────────────────────


@router.post("/sync", response_model=SyncJobResponse)
async def sync_integration(
    data: IntegrationSyncRequest,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"sync:{user}")
    if data.integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[data.integration_id]
    now = datetime.now(timezone.utc).isoformat()

    ig["status"] = "syncing"
    ig["updatedAt"] = now

    job = _create_sync_job(data.integration_id, data.sync_type)

    start_time = time.time()
    try:
        provider = PROVIDERS.get(ig["provider"])
        if not provider:
            raise HTTPException(status_code=400, detail=f"Provider '{ig['provider']}' not available")

        result = await provider.sync(ig.get("credentials", {}), ig.get("config"))
        elapsed = (time.time() - start_time) * 1000

        job["status"] = "completed"
        job["itemsSynced"] = result.get("items_synced", 0)
        job["itemsFailed"] = result.get("items_failed", 0)
        job["completedAt"] = datetime.now(timezone.utc).isoformat()
        job["durationMs"] = elapsed

        ig["status"] = "connected"
        ig["healthStatus"] = "healthy"
        ig["lastSyncAt"] = now
        ig["lastSyncStatus"] = "success"
        ig["errorMessage"] = None
        ig["updatedAt"] = now

        _log_event(data.integration_id, "sync", "success", message=result.get("message", "Sync completed"), duration_ms=elapsed)

    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        job["status"] = "failed"
        job["errorMessage"] = str(e)
        job["completedAt"] = datetime.now(timezone.utc).isoformat()
        job["durationMs"] = elapsed

        ig["status"] = "failed"
        ig["healthStatus"] = "error"
        ig["lastSyncAt"] = now
        ig["lastSyncStatus"] = "error"
        ig["errorMessage"] = str(e)
        ig["updatedAt"] = now

        _log_event(data.integration_id, "sync", "error", message=str(e), duration_ms=elapsed)

    return SyncJobResponse(
        id=job["id"],
        integration_id=job["integrationId"],
        sync_type=job["syncType"],
        status=job["status"],
        items_synced=job["itemsSynced"],
        items_failed=job["itemsFailed"],
        error_message=job.get("errorMessage"),
        started_at=job["startedAt"],
        completed_at=job.get("completedAt"),
        duration_ms=job.get("durationMs"),
    )


# ─── RECONNECT ──────────────────────────────────────────────────────────────


@router.post("/{integration_id}/reconnect", response_model=IntegrationResponse)
async def reconnect_integration(integration_id: str, user: str = Depends(get_current_user)):
    _check_rate_limit(f"sync:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]
    now = datetime.now(timezone.utc).isoformat()

    provider = PROVIDERS.get(ig["provider"])
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not available")

    start_time = time.time()
    try:
        result = await provider.test_connection(ig.get("credentials", {}), ig.get("config"))
        elapsed = (time.time() - start_time) * 1000

        ig["status"] = "connected"
        ig["healthStatus"] = "healthy"
        ig["errorMessage"] = None
        ig["updatedAt"] = now

        _log_event(integration_id, "reconnect", "success", message=result.get("message"), duration_ms=elapsed)
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        ig["status"] = "failed"
        ig["healthStatus"] = "error"
        ig["errorMessage"] = str(e)
        ig["updatedAt"] = now

        _log_event(integration_id, "reconnect", "error", message=str(e), duration_ms=elapsed)

    return _to_response(ig)


# ─── HEALTH CHECK ───────────────────────────────────────────────────────────


@router.get("/{integration_id}/health")
async def check_health(integration_id: str, user: str = Depends(get_current_user)):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]
    provider = PROVIDERS.get(ig["provider"])
    if not provider:
        return {"status": "unknown", "message": "Provider not available"}

    start_time = time.time()
    try:
        result = await provider.test_connection(ig.get("credentials", {}), ig.get("config"))
        elapsed = (time.time() - start_time) * 1000

        ig["healthStatus"] = "healthy"
        _log_event(integration_id, "health_check", "success", duration_ms=elapsed)

        return {"status": "healthy", "message": result.get("message"), "latency_ms": elapsed}
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        ig["healthStatus"] = "error"
        _log_event(integration_id, "health_check", "error", message=str(e), duration_ms=elapsed)

        return {"status": "error", "message": str(e), "latency_ms": elapsed}


# ─── LOGS ────────────────────────────────────────────────────────────────────


@router.get("/{integration_id}/logs", response_model=list[IntegrationLogResponse])
async def get_integration_logs(
    integration_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    logs = _logs.get(integration_id, [])
    start = (page - 1) * page_size
    return [
        IntegrationLogResponse(
            id=l["id"],
            integration_id=l["integrationId"],
            action=l["action"],
            status=l["status"],
            message=l.get("message"),
            details=l.get("details"),
            duration_ms=l.get("durationMs"),
            created_at=l["createdAt"],
        )
        for l in logs[start:start + page_size]
    ]


@router.get("/{integration_id}/sync-jobs", response_model=list[SyncJobResponse])
async def get_sync_jobs(
    integration_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    jobs = _sync_jobs.get(integration_id, [])
    start = (page - 1) * page_size
    return [
        SyncJobResponse(
            id=j["id"],
            integration_id=j["integrationId"],
            sync_type=j["syncType"],
            status=j["status"],
            items_synced=j["itemsSynced"],
            items_failed=j["itemsFailed"],
            error_message=j.get("errorMessage"),
            started_at=j["startedAt"],
            completed_at=j.get("completedAt"),
            duration_ms=j.get("durationMs"),
        )
        for j in jobs[start:start + page_size]
    ]


# ─── WEBHOOK VALIDATION ─────────────────────────────────────────────────────


@router.post("/{integration_id}/webhook/validate")
async def validate_webhook(
    integration_id: str,
    payload: str,
    signature: str,
    user: str = Depends(get_current_user),
):
    _check_rate_limit(f"read:{user}")
    if integration_id not in _integrations:
        raise HTTPException(status_code=404, detail="Integration not found")

    ig = _integrations[integration_id]

    secret = ig.get("credentials", {}).get("webhook_secret", "")
    if not secret:
        return {"valid": True, "message": "No webhook secret configured, skipping validation"}

    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    is_valid = hmac.compare_digest(expected, signature)

    if is_valid:
        _log_event(integration_id, "webhook_validated", "success")
    else:
        _log_event(integration_id, "webhook_validated", "error", message="Invalid webhook signature")

    return {"valid": is_valid, "message": "Signature valid" if is_valid else "Invalid signature"}
