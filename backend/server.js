const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());

// Launch Chromium with a vendored-first approach and a guarded fallback.
async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (err) {
    // If Render is still forcing a cache path or the vendored browser wasn't found,
    // fall back to a runtime install *once* to unblock.
    const msg = String(err || "");
    const looksLikeMissingExec =
      msg.includes("Executable doesn't exist") || msg.includes("playwright install");

    if (!looksLikeMissingExec) throw err;

    console.warn("⚠️ Playwright browser not found at runtime. Installing chromium now...");
    try {
      // Install to vendored path as well (PLAYWRIGHT_BROWSERS_PATH=0)
      execSync("PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium", { stdio: "inherit" });
      return await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } catch (installErr) {
      console.error("❌ Runtime install failed:", installErr);
      throw err;
    }
  }
}

// Reuse a single browser; isolate per request with contexts.
let browserPromise = launchBrowser();

app.post("/scan", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL (must start with http or https)" });
  }

  let browser, context, page;
  try {
    browser = await browserPromise;
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(1500);

    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

    const results = await page.evaluate(async () => {
      return await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] });
    });

    res.json({
      url,
      timestamp: new Date().toISOString(),
      violations: results.violations || [],
      passes: results.passes?.length || 0,
      incomplete: results.incomplete?.length || 0,
      raw: results,
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: err.message || "Scan failed" });
  } finally {
    try { if (page) await page.close(); } catch {}
    try { if (context) await context.close(); } catch {}
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Scanner API running on http://localhost:${PORT}`);
});
