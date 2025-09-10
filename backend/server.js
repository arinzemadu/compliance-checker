// server.js
const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Launch Chromium with a runtime fallback.
 * If Chromium is missing (Render cache issue), auto-installs it once.
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

// Example route that uses Playwright
app.get("/screenshot", async (req, res) => {
  let browser;
  try {
    browser = await launchBrowserWithFallback();
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const screenshot = await page.screenshot();
    res.type("image/png").send(screenshot);
  } catch (e) {
    console.error("❌ Error in /screenshot:", e);
    res.status(500).send("Playwright error: " + e.message);
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
