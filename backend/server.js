const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

// tiny sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Launch Chromium with a runtime fallback.
 * If Chromium is missing, auto-installs it once inside the container.
 */
async function launchBrowserWithFallback() {
  try {
    return await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (err) {
    console.error("❌ Chromium launch failed:", err.message);

    if (String(err).includes("playwright install")) {
      console.log("➡ Installing Chromium at runtime...");
      execSync("npx playwright install chromium", { stdio: "inherit" });

      // Retry after install
      return await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    throw err;
  }
}

app.post("/scan", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL (must start with http or https)" });
  }

  let browser;
  try {
    browser = await launchBrowserWithFallback();
    const page = await browser.newPage();

    // Load page
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Small delay to let JS-heavy sites render
    await sleep(1500);

    // Inject axe-core
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

    // Run axe inside the page
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: ["wcag2a", "wcag2aa"],
      });
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
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Scanner API running on http://localhost:${PORT}`);
});
