const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

// tiny sleep helper
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Accessibility Scan (/scan)
 */
app.post("/scan", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res
      .status(400)
      .json({ error: "Invalid URL (must start with http or https)" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    if (page.setBypassCSP) await page.setBypassCSP(true);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForFunction(
        () => document.querySelectorAll("body *").length > 20,
        { timeout: 8000 }
      );
    } catch (_) {}

    await sleep(1500);

    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });

    const hasAxe = await page.evaluate(() => typeof window.axe !== "undefined");
    if (!hasAxe) throw new Error("axe-core failed to inject");

    const results = await page.evaluate(async () => {
      return await window.axe.run(document.documentElement, {
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

/**
 * Cookie Compliance Scan (/scan-cookie)
 */
app.post("/scan-cookie", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res
      .status(400)
      .json({ error: "Invalid URL (must start with http or https)" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    if (page.setBypassCSP) await page.setBypassCSP(true);

    // Capture network requests to find third-party domains
    const thirdPartyDomains = new Set();
    page.on("request", (req) => {
      try {
        const u = new URL(req.url());
        if (!u.hostname.includes(new URL(url).hostname)) {
          thirdPartyDomains.add(u.hostname);
        }
      } catch {}
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(2000);

    // Collect cookies
    const cookies = await page.cookies();

    // Basic banner detection (expand with CMP selectors if needed)
    const bannerDetected = await page.evaluate(() => {
      const selectors = ["#cookie-banner", ".cookie-banner", "#onetrust-banner-sdk"];
      return selectors.some((sel) => document.querySelector(sel));
    });

    // Build summary
    const summary = {
      totalCookies: cookies.length,
      thirdParty: [...thirdPartyDomains].length,
      risky: cookies.filter((c) =>
        /ga|gid|fb|track|ads|marketing/i.test(c.name)
      ).length,
      bannerDetected,
      preConsentCookies: cookies.length, // ⚠️ here we don’t simulate click yet
    };

    res.json({
      url,
      timestamp: new Date().toISOString(),
      complianceScore:
        summary.totalCookies === 0
          ? 100
          : Math.max(0, 100 - summary.risky * 10),
      summary,
      cookies: cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        expiry: c.expires ? new Date(c.expires * 1000).toISOString() : "Session",
        category: /ga|gid/i.test(c.name)
          ? "Analytics"
          : /ads|fb/i.test(c.name)
          ? "Advertising"
          : "Other",
        firstParty: c.domain.includes(new URL(url).hostname),
        risky: /ga|gid|fb|track|ads/i.test(c.name),
      })),
      banner: {
        detected: bannerDetected,
        provider: bannerDetected ? "Unknown/Custom" : null,
        blocksPreConsent: false, // would need a before/after accept simulation
        options: bannerDetected ? ["Accept All"] : [],
      },
    });
  } catch (err) {
    console.error("Cookie scan error:", err);
    res.status(500).json({ error: err.message || "Cookie scan failed" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Scanner API running on http://localhost:${PORT}`);
});
