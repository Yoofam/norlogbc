# Tests

## Cross-device persistence

`cross-device-persistence.py` proves that an admin edit is stored in the cloud
database and is visible to every other device — not just the browser that made
the change.

What it does:

1. **Device A** (desktop context) opens `/admin`, unlocks with the server PIN,
   edits the **Site name** in the Site tab and saves.
2. **Device B** (a brand-new browser context with a mobile viewport and mobile
   user agent — no shared cookies, localStorage or cache) loads the public site
   and asserts the new value is rendered.
3. The original value is restored and re-verified, so the test leaves no trace.

Run it against a running app (dev server or a published URL):

```bash
ADMIN_PIN=**** python3 tests/cross-device-persistence.py
```

Set `BASE_URL` to test the published site instead of `http://localhost:8080`.
Prints `RESULT: PASS` on success; screenshots land in `tests/screenshots/`.
