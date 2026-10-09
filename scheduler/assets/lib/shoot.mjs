// shoot.mjs — 截图工具（playwright-core ESM）
// 用法: node shoot.mjs <html路径> <输出png路径>
import { chromium } from '/home/tsukikage/browser/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import os from 'node:os';

const EXE = process.env.CHROME_PATH || path.join(os.homedir(), ".cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux-arm64/chrome-headless-shell");
const [html, out] = process.argv.slice(2);
if (!html || !out) { console.error("用法: node shoot.mjs <html> <out.png>"); process.exit(1); }

const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ["--no-sandbox","--disable-dev-shm-usage","--hide-scrollbars","--force-device-scale-factor=1"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto("file://" + path.resolve(html), { waitUntil: "load" });
await page.waitForTimeout(600);
await page.screenshot({ path: out });
await browser.close();
console.log("✓ " + out);
