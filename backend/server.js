const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const CHROME_PATH =
  process.env.CHROME_PATH || puppeteer.executablePath();

// tiny sleep helper (works in all Puppeteer versions)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scan", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL (must start with http or https)" });
  }

  let browser;
  try {


browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  executablePath: CHROME_PATH,
});

console.log("Puppeteer executable path:", puppeteer.executablePath());



    const page = await browser.newPage();

    // Some sites block inline/injected scripts via CSP; this bypasses it.
    if (page.setBypassCSP) {
      await page.setBypassCSP(true);
    }

    // Navigate and wait for DOM
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Heuristic: wait until at least some content is present (helps JS-heavy sites)
    try {
      await page.waitForFunction(
        () => document.querySelectorAll("body *").length > 20,
        { timeout: 8000 }
      );
    } catch (_) {
      // ignore if it times out; we'll still try to run axe
    }

    // Small extra delay to allow late JS to render
    await sleep(1500);

    // Inject axe-core (use path to avoid issues with inline content)
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

    // Verify axe is present in the page context
    const hasAxe = await page.evaluate(() => typeof window.axe !== "undefined");
    if (!hasAxe) {
      throw new Error("axe-core failed to inject");
    }

    // Run axe on the whole document element
    const results = await page.evaluate(async () => {
      return await window.axe.run(document.documentElement, {
        runOnly: ["wcag2a", "wcag2aa"],
      });
    });

    // Console debug (optional)
    console.log("AXE:", {
      violations: results.violations?.length || 0,
      passes: results.passes?.length || 0,
      incomplete: results.incomplete?.length || 0,
    });

    // Always return safe, consistent fields
    res.json({
      url,
      timestamp: new Date().toISOString(),
      violations: Array.isArray(results.violations) ? results.violations : [],
      passes: Array.isArray(results.passes) ? results.passes.length : 0,
      incomplete: Array.isArray(results.incomplete) ? results.incomplete.length : 0,
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