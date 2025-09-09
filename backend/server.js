const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());

// Simple scan endpoint
app.post("/scan", async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  let browser;
  try {
    // Detect if running on Render
    const isRender = process.env.RENDER === "true";

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: isRender ? puppeteer.executablePath() : undefined,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Inject axe-core
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
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Scanner API running on http://localhost:${PORT}`);
});
