"""
scrape_njdg.py
Live NJDG scraper using Playwright.

Usage:
    pip install playwright
    playwright install chromium
    python scrape_njdg.py

Output:
    raw/   — HTML snapshots of each page
    ../frontend/public/data/*.json — processed datasets
"""

import asyncio
import json
import os
import time
from pathlib import Path
from playwright.async_api import async_playwright, Page, TimeoutError as PwTimeout

RAW_DIR = Path(__file__).parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

NJDG_BASE = "https://njdg.ecourts.gov.in/njdgnew/"

async def wait_for_table(page: Page, timeout: int = 15000):
    """Wait until a table with data appears."""
    await page.wait_for_selector("table tbody tr", timeout=timeout)

async def get_state_list(page: Page) -> list[dict]:
    """Navigate to NJDG and extract state list."""
    await page.goto(NJDG_BASE, wait_until="networkidle")
    await page.wait_for_timeout(2000)

    # Save raw snapshot
    html = await page.content()
    (RAW_DIR / "index.html").write_text(html, encoding="utf-8")

    states = []
    # NJDG typically shows states in a dropdown or clickable table
    # Attempt to find state links
    try:
        await wait_for_table(page)
        rows = await page.query_selector_all("table tbody tr")
        for row in rows:
            cells = await row.query_selector_all("td")
            if len(cells) >= 2:
                name_el = await cells[0].query_selector("a") or cells[0]
                name = (await name_el.inner_text()).strip()
                href = await name_el.get_attribute("href") or ""
                pending_text = (await cells[1].inner_text()).strip().replace(",", "")
                try:
                    pending = int(pending_text)
                except ValueError:
                    pending = 0
                if name:
                    states.append({"name": name, "href": href, "raw_pending": pending})
    except PwTimeout:
        print("⚠ State table not found — NJDG structure may have changed.")

    return states

async def scrape_state(page: Page, state: dict) -> dict:
    """Scrape details for a single state."""
    if state.get("href"):
        url = NJDG_BASE + state["href"].lstrip("/")
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(1500)
        html = await page.content()
        safe_name = state["name"].replace(" ", "_").replace("/", "-")
        (RAW_DIR / f"state_{safe_name}.html").write_text(html, encoding="utf-8")

    return {
        "name": state["name"],
        "total_pending": state.get("raw_pending", 0),
        "raw_html_saved": True,
    }

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120"
        )
        page = await context.new_page()

        print("🌐 Connecting to NJDG...")
        states = await get_state_list(page)

        if not states:
            print("⚠ No states scraped. Using synthetic data generator instead.")
            await browser.close()
            return

        print(f"✓ Found {len(states)} states")
        results = []
        for i, state in enumerate(states, 1):
            print(f"  [{i}/{len(states)}] Scraping {state['name']}...")
            try:
                data = await scrape_state(page, state)
                results.append(data)
                await asyncio.sleep(0.5)  # polite delay
            except Exception as e:
                print(f"    ⚠ Error: {e}")

        await browser.close()

        out = Path(__file__).parent / "raw" / "scraped_states.json"
        out.write_text(json.dumps(results, indent=2, ensure_ascii=False))
        print(f"\n✅ Raw data saved to {out}")
        print("Next step: run export_datasets.py to normalize and export.")

if __name__ == "__main__":
    asyncio.run(main())
