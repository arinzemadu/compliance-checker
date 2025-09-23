const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// tiny sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());


function findVendoredChromium() {
  try {
    const base = path.join(__dirname, "node_modules", "playwright", ".local-browsers");
    if (!fs.existsSync(base)) return null;

    const builds = fs.readdirSync(base)
      .filter((d) => d.startsWith("chromium")) // chromium-XXXX or chromium_headless_shell-XXXX
      .map((d) => path.join(base, d));

    for (const b of builds) {
      const linuxChrome = path.join(b, "chrome-linux", "chrome");
      const linuxHeadless = path.join(b, "chrome-linux", "headless_shell");
      if (fs.existsSync(linuxChrome)) return linuxChrome;
      if (fs.existsSync(linuxHeadless)) return linuxHeadless;
    }
  } catch (_) {}
  return null;
}

const vendoredChromiumPath = findVendoredChromium();
if (vendoredChromiumPath) {
  console.log("🧭 Using vendored Chromium:", vendoredChromiumPath);
} else {
  console.log("⚠️ Vendored Chromium not found; Playwright will use its default resolution.");
}

// Launch a singleton browser once (fail fast if missing)
const browserPromise = (async () => {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(vendoredChromiumPath ? { executablePath: vendoredChromiumPath } : {})
  });
})();

app.get("/health", (_req, res) => res.type("text/plain").send("ok"));

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
      raw: results
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
