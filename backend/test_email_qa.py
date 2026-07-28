import sys

import requests

B = "http://localhost:8000/api/v1/email"
WS = "ws-default"
S = 10


if __name__ == "__main__":
    passed = 0
    failed = 0

    try:
        requests.get("http://localhost:8000/health", timeout=3)
    except requests.exceptions.ConnectionError:
        print("SKIP: Backend server not running on localhost:8000")
        sys.exit(0)

    def test(name, fn):
        global passed, failed
        try:
            ok = fn()
            if ok:
                passed += 1
                print(f"  PASS  {name}")
            else:
                failed += 1
                print(f"  FAIL  {name}")
        except Exception as e:
            failed += 1
            print(f"  FAIL  {name}: {e}")

    print("=== CAMPAIGNS CRUD ===")
    cid = [None]

    def t_create():
        r = requests.post(f"{B}/campaigns", json={"workspace_id": WS, "name": "Full QA", "subject": "QA Subject", "email_type": "welcome", "brand": "QA Corp"}, timeout=S)
        d = r.json(); cid[0] = d.get("id")
        return r.status_code == 200 and cid[0] is not None
    test("Create", t_create)

    def t_get():
        r = requests.get(f"{B}/campaigns/{cid[0]}", timeout=S)
        return r.status_code == 200 and r.json().get("id") == cid[0]
    test("Get", t_get)

    def t_update():
        r = requests.put(f"{B}/campaigns/{cid[0]}", json={"name": "Updated QA", "subject": "Updated Sub", "html_content": "<p>Full HTML</p>", "preview_text": "Preview"}, timeout=S)
        d = r.json()
        return r.status_code == 200 and d.get("name") == "Updated QA" and d.get("preview_text") == "Preview"
    test("Update", t_update)

    def t_list():
        r = requests.get(f"{B}/campaigns", params={"workspace_id": WS}, timeout=S)
        return r.status_code == 200 and r.json().get("total", 0) >= 1
    test("List", t_list)

    def t_list_filter():
        r = requests.get(f"{B}/campaigns", params={"workspace_id": WS, "email_type": "welcome"}, timeout=S)
        return r.status_code == 200
    test("List filter", t_list_filter)

    def t_list_search():
        r = requests.get(f"{B}/campaigns", params={"workspace_id": WS, "search": "QA"}, timeout=S)
        return r.status_code == 200
    test("List search", t_list_search)

    def t_dup():
        r = requests.post(f"{B}/campaigns/{cid[0]}/duplicate", timeout=S)
        d = r.json()
        return r.status_code == 200 and "(Copy)" in d.get("name", "")
    test("Duplicate", t_dup)

    def t_send():
        r = requests.post(f"{B}/campaigns/{cid[0]}/send", timeout=S)
        return r.status_code == 200 and r.json().get("status") == "sent"
    test("Send", t_send)

    def t_send_again():
        r = requests.post(f"{B}/campaigns/{cid[0]}/send", timeout=S)
        return r.status_code == 400
    test("Re-send blocked", t_send_again)

    def t_history():
        r = requests.get(f"{B}/campaigns/{cid[0]}/history", timeout=S)
        return r.status_code == 200 and isinstance(r.json(), list)
    test("History", t_history)

    print()
    print("=== TEMPLATES ===")
    tid = [None]

    def t_create_tmpl():
        r = requests.post(f"{B}/templates", json={"workspace_id": WS, "name": "QA Tmpl", "email_type": "welcome", "subject": "Hi", "html_content": "<p>Hi</p>"}, timeout=S)
        tid[0] = r.json().get("id")
        return r.status_code == 200 and tid[0] is not None
    test("Create template", t_create_tmpl)

    def t_get_tmpl():
        return requests.get(f"{B}/templates/{tid[0]}", timeout=S).status_code == 200
    test("Get template", t_get_tmpl)

    def t_update_tmpl():
        r = requests.put(f"{B}/templates/{tid[0]}", json={"name": "Updated Tmpl", "description": "New desc"}, timeout=S)
        d = r.json()
        return r.status_code == 200 and d.get("name") == "Updated Tmpl" and d.get("description") == "New desc"
    test("Partial update template", t_update_tmpl)

    def t_use_tmpl():
        r = requests.post(f"{B}/templates/{tid[0]}/use", timeout=S)
        return r.status_code == 200 and r.json().get("usage_count", 0) >= 1
    test("Use template", t_use_tmpl)

    def t_list_tmpl():
        r = requests.get(f"{B}/templates", params={"workspace_id": WS}, timeout=S)
        return r.status_code == 200 and len(r.json()) >= 1
    test("List templates", t_list_tmpl)

    def t_delete_tmpl():
        return requests.delete(f"{B}/templates/{tid[0]}", timeout=S).status_code == 200
    test("Delete template", t_delete_tmpl)

    def t_sys_protected():
        r = requests.get(f"{B}/templates", params={"workspace_id": WS}, timeout=S)
        sys_tmpls = [t for t in r.json() if t.get("is_system")]
        if sys_tmpls:
            sid = sys_tmpls[0]["id"]
            r2 = requests.put(f"{B}/templates/{sid}", json={"name": "HACKED"}, timeout=S)
            return r2.status_code == 400
        return True
    test("System template protected", t_sys_protected)

    print()
    print("=== AI ACTION ===")
    r = requests.post(f"{B}/campaigns", json={"workspace_id": WS, "name": "AI Test", "subject": "AI Sub", "email_type": "promotional", "html_content": "<p>Original content about our amazing product that helps businesses grow.</p>"}, timeout=S)
    ai_cid = r.json().get("id")

    def t_ai_rewrite():
        r = requests.post(f"{B}/ai/action", json={"campaign_id": ai_cid, "action": "rewrite"}, timeout=30)
        d = r.json()
        return r.status_code == 200 and "original" in d and "updated" in d
    test("AI rewrite", t_ai_rewrite)

    def t_ai_invalid():
        r = requests.post(f"{B}/ai/action", json={"campaign_id": ai_cid, "action": "bogus"}, timeout=S)
        return r.status_code == 400
    test("AI invalid", t_ai_invalid)

    def t_ai_404():
        r = requests.post(f"{B}/ai/action", json={"campaign_id": "nonexistent", "action": "rewrite"}, timeout=S)
        return r.status_code == 404
    test("AI 404", t_ai_404)

    print()
    print("=== STATS ===")
    def t_stats():
        r = requests.get(f"{B}/campaigns/stats", params={"workspace_id": WS}, timeout=S)
        return r.status_code == 200 and "total_campaigns" in r.json()
    test("Stats", t_stats)

    print()
    print("=== EDGE CASES ===")
    def t_404_get():
        return requests.get(f"{B}/campaigns/nonexistent", timeout=S).status_code == 404
    test("Get 404", t_404_get)

    def t_404_del():
        return requests.delete(f"{B}/campaigns/nonexistent", timeout=S).status_code == 404
    test("Delete 404", t_404_del)

    def t_create_missing():
        r = requests.post(f"{B}/campaigns", json={"workspace_id": WS}, timeout=S)
        return r.status_code == 422
    test("Create missing fields", t_create_missing)

    print()
    print(f"=== RESULTS: {passed} passed, {failed} failed out of {passed + failed} ===")
    sys.exit(1 if failed else 0)
