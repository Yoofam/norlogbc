import asyncio, os, time
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8080")
PIN = os.environ["ADMIN_PIN"]
SHOT = Path(__file__).parent / "screenshots"; SHOT.mkdir(exist_ok=True)
MARK = f"NORLOG-{int(time.time())}"

async def admin_login(page):
    await page.goto(f"{BASE}/admin", wait_until="networkidle")
    await page.fill('input[type="password"]', PIN)
    await page.click('button[type="submit"]')
    await page.wait_for_selector ("text=Control Room", timeout=15000)

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        # --- Device A: desktop admin makes an edit ---
        a = await b.new_context(viewport={"width":1280,"height":1800})
        pa = await a.new_page()
        await admin_login(pa)
        await pa.click('button:has-text("site")')
        await pa.wait_for_selector('text=Site name', timeout=10000)
        field = pa.locator('label:has-text("Site name") input').first
        original = await field.input_value()
        await field.fill(MARK)
        await pa.click('button:has-text("Save")')
        await pa.wait_for_timeout(3000)
        await pa.screenshot(path=str(SHOT/"a_admin_saved.png"))
        print("device A saved siteName:", MARK, "(was", original + ")")

        # --- Device B: fresh mobile context, no shared storage ---
        bb = await b.new_context(viewport={"width":390,"height":844},
                                 user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
        pb = await bb.new_page()
        await pb.goto(BASE, wait_until="networkidle")
        body = await pb.inner_text("body")
        ok = MARK in body
        await pb.screenshot(path=str(SHOT/"b_other_device.png"))
        print("device B sees edit:", ok)

        # --- restore ---
        await field.fill(original)
        await pa.click('button:has-text("Save")')
        await pa.wait_for_timeout(3000)
        await pb.goto(BASE, wait_until="networkidle")
        restored = original in await pb.inner_text("body")
        print("restored:", restored)
        print("RESULT:", "PASS" if ok and restored else "FAIL")
        await b.close()

asyncio.run(main())
