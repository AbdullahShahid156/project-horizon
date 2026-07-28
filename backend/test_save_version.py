"""Test save and version flow in detail."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
PASS = FAIL = 0

def test(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}")
    else:
        FAIL += 1
        print(f"  FAIL  {name}  {detail}")

print("=" * 60)
print("1. GENERATE CONTENT")
print("=" * 60)
r = client.post("/api/v1/content/generate", json={
    "content_type": "blog_post",
    "business_name": "Test Corp",
    "product": "analytics",
    "industry": "tech",
    "target_audience": "CTOs",
    "tone": "professional",
    "length": "medium",
    "workspace_id": "ws-default"
}, timeout=120)
gen = r.json()
cid = gen["content_id"]
test("Generate 200", r.status_code == 200)
test("Has content_id", bool(cid))
orig_html = gen.get("html_body", "")
test("Has html_body", bool(orig_html))
print(f"  Generated: {gen.get('word_count')} words")

print("\n" + "=" * 60)
print("2. GET CONTENT (editor load)")
print("=" * 60)
r = client.get(f"/api/v1/content/{cid}")
item = r.json()
test("Get 200", r.status_code == 200)
test("Has html_body", bool(item.get("html_body")))
test("Has plain_body", bool(item.get("plain_body")))
test("Has title", bool(item.get("title")))
test("current_version is 1", item.get("current_version") == 1, item.get("current_version"))
print(f"  html_body len: {len(item.get('html_body', ''))}")
print(f"  plain_body len: {len(item.get('plain_body', ''))}")
print(f"  current_version: {item.get('current_version')}")
print(f"  word_count: {item.get('word_count')}")

print("\n" + "=" * 60)
print("3. AUTO-SAVE")
print("=" * 60)
new_html = "<h1>Updated Title</h1><p>This is auto-saved content with modifications for testing.</p>"
r = client.post(f"/api/v1/content/{cid}/auto-save", json={
    "html_body": new_html,
    "plain_body": "Updated Title This is auto-saved content with modifications for testing.",
})
test("Auto-save 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")

# Verify it persisted
r = client.get(f"/api/v1/content/{cid}")
item = r.json()
test("Auto-save persisted html_body", "Updated Title" in (item.get("html_body") or ""), item.get("html_body", "")[:100])
test("Auto-save preserved version", item.get("current_version") == 1, item.get("current_version"))

print("\n" + "=" * 60)
print("4. AUTO-SAVE VERSIONS (should create version)")
print("=" * 60)
# Do another auto-save with different content
r2_html = "<p>Second auto-save with different content for version tracking test.</p>"
r = client.post(f"/api/v1/content/{cid}/auto-save", json={
    "html_body": r2_html,
    "plain_body": "Second auto-save with different content for version tracking test.",
})
test("Auto-save 2 200", r.status_code == 200)

r = client.get(f"/api/v1/content/{cid}/versions")
versions = r.json()
test("Versions list 200", r.status_code == 200)
test("Has versions", len(versions) > 0, f"count={len(versions)}")
for v in versions:
    print(f"  v{v.get('version_number')}: auto_save={v.get('is_auto_save')}, summary='{v.get('change_summary', '')}', html_len={len(v.get('html_body', '') or '')}")

print("\n" + "=" * 60)
print("5. MANUAL SAVE (update)")
print("=" * 60)
r = client.put(f"/api/v1/content/{cid}", json={
    "title": "Manually Saved Title",
    "html_body": "<h1>Manually Saved</h1><p>This was saved via manual save button.</p>",
    "plain_body": "Manually Saved This was saved via manual save button.",
    "seo_data": {
        "meta_title": "Test SEO Title",
        "meta_description": "Test SEO description",
        "keywords": ["test", "seo"],
    },
    "change_summary": "Manual save with SEO data",
})
test("Manual save 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")

# Verify
r = client.get(f"/api/v1/content/{cid}")
item = r.json()
test("Title updated", item.get("title") == "Manually Saved Title", item.get("title"))
test("HTML updated", "Manually Saved" in (item.get("html_body") or ""))
test("SEO data saved", item.get("seo_data", {}).get("meta_title") == "Test SEO Title", item.get("seo_data"))
test("SEO keywords saved", "test" in (item.get("seo_data", {}).get("keywords") or []))

print("\n" + "=" * 60)
print("6. VERSIONS AFTER MANUAL SAVE")
print("=" * 60)
r = client.get(f"/api/v1/content/{cid}/versions")
versions = r.json()
test("Versions 200", r.status_code == 200)
test("More versions now", len(versions) >= 2, f"count={len(versions)}")
for v in versions:
    print(f"  v{v.get('version_number')}: auto_save={v.get('is_auto_save')}, summary='{v.get('change_summary', '')}'")

print("\n" + "=" * 60)
print("7. RESTORE VERSION")
print("=" * 60)
if versions:
    # Find the first version (original)
    first_v = versions[-1]  # oldest
    vid = first_v["id"]
    test("First version exists", bool(vid))
    print(f"  Restoring v{first_v.get('version_number')} (id={vid[:8]}...)")
    
    r = client.post(f"/api/v1/content/{cid}/versions/{vid}/restore")
    test("Restore 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
    
    # Verify restored
    r = client.get(f"/api/v1/content/{cid}")
    restored = r.json()
    test("Restored version incremented", restored.get("current_version") > 1, restored.get("current_version"))
    test("Content restored", bool(restored.get("html_body")))
    print(f"  Restored to v{restored.get('current_version')}")
    print(f"  html_body[:100]: {(restored.get('html_body') or '')[:100]}")

print("\n" + "=" * 60)
print("8. SAVE AFTER RESTORE")
print("=" * 60)
r = client.put(f"/api/v1/content/{cid}", json={
    "title": "Save After Restore",
    "html_body": "<p>Content saved after restoring a previous version.</p>",
    "plain_body": "Content saved after restoring a previous version.",
    "change_summary": "Save after version restore",
})
test("Save after restore 200", r.status_code == 200)

r = client.get(f"/api/v1/content/{cid}")
item = r.json()
test("Save after restore persisted", item.get("title") == "Save After Restore")

r = client.get(f"/api/v1/content/{cid}/versions")
versions = r.json()
test("Versions updated after save", len(versions) >= 3, f"count={len(versions)}")
print(f"  Total versions: {len(versions)}")

print("\n" + "=" * 60)
print("9. EDGE CASES")
print("=" * 60)
# Auto-save with empty content
r = client.post(f"/api/v1/content/{cid}/auto-save", json={
    "html_body": "",
    "plain_body": "",
})
test("Auto-save empty content 200", r.status_code == 200, f"{r.status_code}")

# Auto-save with very long content
long_html = "<p>" + "word " * 5000 + "</p>"
r = client.post(f"/api/v1/content/{cid}/auto-save", json={
    "html_body": long_html,
    "plain_body": "word " * 5000,
})
test("Auto-save long content 200", r.status_code == 200, f"{r.status_code}")

# Auto-save nonexistent
r = client.post("/api/v1/content/nonexistent-id/auto-save", json={
    "html_body": "<p>test</p>",
    "plain_body": "test",
})
test("Auto-save nonexistent 404", r.status_code == 404, r.status_code)

# Restore nonexistent version
r = client.post(f"/api/v1/content/{cid}/versions/nonexistent/restore")
test("Restore nonexistent version error", r.status_code in [400, 404], r.status_code)

print("\n" + "=" * 60)
print("10. DUPLICATE + SAVE")
print("=" * 60)
r = client.post(f"/api/v1/content/{cid}/duplicate")
dup = r.json()
dup_id = dup.get("id")
test("Duplicate 200", r.status_code == 200)
test("Duplicate has own id", dup_id != cid)

# Save to duplicate
r = client.put(f"/api/v1/content/{dup_id}", json={
    "title": "Duplicate Modified",
    "html_body": "<p>Modified duplicate content.</p>",
    "plain_body": "Modified duplicate content.",
    "change_summary": "Modified duplicate",
})
test("Save to duplicate 200", r.status_code == 200)

# Verify original unchanged
r = client.get(f"/api/v1/content/{cid}")
orig = r.json()
test("Original unchanged", orig.get("title") == "Save After Restore")

# Cleanup
client.delete(f"/api/v1/content/{dup_id}")

print("\n" + "=" * 60)
print(f"RESULTS: {PASS} passed, {FAIL} failed out of {PASS + FAIL}")
print("=" * 60)
