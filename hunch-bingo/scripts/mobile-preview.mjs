/**
 * Opens a headed Chromium browser at iPhone 14 Pro dimensions (390×844).
 * Useful for testing mobile layout during development.
 *
 * Usage:
 *   npm run preview:mobile                   → opens http://localhost:3000
 *   npm run preview:mobile /games            → opens a specific path
 *   npm run preview:mobile /bingo-sheets/new → etc.
 */

import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const path = process.argv[2] ?? "/";
const url  = path.startsWith("http") ? path : `${BASE}${path}`;

const browser = await chromium.launch({ headless: false, slowMo: 0 });

const context = await browser.newContext({
  viewport:  { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile:  true,
  hasTouch:  true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

const page = await context.newPage();
await page.goto(url);

console.log(`\n  Mobile preview open: ${url}`);
console.log("  Viewport: 390×844 (iPhone 14 Pro)");
console.log("  Press Ctrl+C to close.\n");

// Keep alive
await new Promise(() => {});
