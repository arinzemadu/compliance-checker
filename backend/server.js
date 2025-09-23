const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());

// Launch a singleton browser once
let browserPromise = chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

app.post("/scan", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res
      .status(400)
      .json({ error: "Invalid URL (must start with http or https)" });
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
    if (page) await page.close();
    if (context) await context.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Scanner API running on http://localhost:${PORT}`);
});
