import { useState } from "react";
import jsPDF from "jspdf";
import complianceMapping from "../data/complianceMapping.json";
import CountryAccordion from "./CountryAccordion";
import Footer from "./Footer";

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("United States");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ---- tiny style helpers (consistent “card” look & accessible colors) ----
  const card = {
    background: "white",
    padding: "1.25rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  };

  const statCard = {
    ...card,
    flex: "1 1 180px",
    minWidth: 180,
    textAlign: "center",
  };

  const badge = (bg, fg = "#fff") => ({
    display: "inline-block",
    padding: "0.15rem 0.5rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    background: bg,
    color: fg,
  });

  const impactStyles = {
    critical: badge("#7f1d1d"), // dark red
    serious: badge("#b91c1c"),
    moderate: badge("#a16207"),
    minor: badge("#334155"),
  };

  const kbd = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    background: "#f3f4f6",
    padding: "4px 6px",
    borderRadius: 6,
    display: "block",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  //const apiBase = process.env.REACT_APP_API_URL || "https://compliance-checker-be.onrender.com";
  const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://compliance-checker-be.onrender.com";



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setProgress(0);

    if (!/^https?:\/\//i.test(url)) {
      setError("Please enter a valid URL starting with http or https.");
      return;
    }

    setLoading(true);
    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 400);

    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, country }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text.slice(0, 200)}`);
      }

      const data = await response.json();
      if (data.error) setError(data.error);
      else {
        setResult(data);
        setProgress(100);
      }
    } catch (err) {
      setError("Something went wrong: " + err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  // -------- PDF: summary + grouped violations + incomplete ----------
  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const line = (y) => doc.line(40, y, 555, y);

    // Header
    doc.setFontSize(18);
    doc.text("Website Accessibility Compliance Report", 40, 50);
    doc.setFontSize(11);
    doc.text(`URL: ${result.url}`, 40, 70);
    doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, 40, 86);

    // Score
    const total =
      (result.violations?.length || 0) + (result.passes || 0) + (result.incomplete || 0);
    const score = total > 0 ? Math.round(((result.passes || 0) / total) * 100) : 0;
    doc.text(`Compliance Score: ${score}%`, 40, 106);
    line(112);

    // Summary
    doc.setFontSize(12);
    doc.text(`Violations: ${result.violations?.length || 0}`, 40, 136);
    doc.text(`Passed Checks: ${result.passes || 0}`, 40, 152);
    doc.text(`Incomplete Checks: ${result.incomplete || 0}`, 40, 168);

    let y = 198;

    const ensureRoom = (extra = 24) => {
      if (y + extra > 800) {
        doc.addPage();
        y = 50;
      }
    };

    // Group violations by impact (for readability)
    const groups = { critical: [], serious: [], moderate: [], minor: [] };
    (result.raw?.violations || []).forEach((v) => {
      const key = v.impact || "minor";
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });

    const order = ["critical", "serious", "moderate", "minor"];
    order.forEach((lvl) => {
      const arr = groups[lvl] || [];
      if (!arr.length) return;

      ensureRoom(40);
      doc.setFontSize(14);
      doc.text(
        `${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Issues (${arr.length})`,
        40,
        y
      );
      y += 14;
      line(y);
      y += 16;

      doc.setFontSize(11);
      arr.forEach((v, i) => {
        ensureRoom(40);
        doc.text(`${i + 1}. ${v.id} — ${v.description} (Impact: ${v.impact})`, 40, y);
        y += 16;

        // Show up to 2 nodes per violation to keep PDF concise
        (v.nodes || []).slice(0, 2).forEach((node) => {
          ensureRoom(42);
          if (node.target?.length) {
            doc.text(`• Target: ${node.target.join(", ")}`, 52, y);
            y += 14;
          }
          if (node.failureSummary) {
            doc.text(`  Summary: ${node.failureSummary}`, 52, y);
            y += 14;
          }
        });
        y += 6;
      });

      y += 6;
    });

    // Incomplete
    const inc = result.raw?.incomplete || [];
    if (inc.length) {
      ensureRoom(40);
      doc.setFontSize(14);
      doc.text(`Checks Needing Review (${inc.length})`, 40, y);
      y += 14;
      line(y);
      y += 16;
      doc.setFontSize(11);
      inc.forEach((item, i) => {
        ensureRoom(20);
        doc.text(`${i + 1}. ${item.id} — ${item.description}`, 40, y);
        y += 16;
      });
    }

    doc.save("compliance-report.pdf");
  };

  // ------------------------- UI -------------------------
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "2rem", maxWidth: 1100, margin: "auto" }}>
      {/* Header */}
      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, color: "#1d4ed8" }}>
        ADA & WCAG Website Accessibility Compliance Checker
      </h1>
      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "1.05rem", color: "#334155" }}>
        Scan your website for <strong>ADA compliance (US)</strong>, <strong>WCAG 2.1 (UK & EU)</strong>, and global accessibility best practices.
        Free single-page scans. Upgrade later for full reports, exports, and scheduled checks.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginTop: "2rem", ...card }}>
        <label htmlFor="site-url" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
          Website URL
        </label>
        <input
          id="site-url"
          type="url"
          placeholder="https://mdutools.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            marginBottom: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
          }}
          required
        />

        <label htmlFor="country" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
          Country / Region
        </label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            marginBottom: "14px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
          }}
        >
          {Object.keys(complianceMapping).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            backgroundColor: "#1d4ed8",
            color: "white",
            fontWeight: 700,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {loading ? "Scanning..." : "Start Scan"}
        </button>
      </form>

      {/* Errors */}
      {error && (
        <div role="alert" style={{ marginTop: "1rem", ...card, borderLeft: "6px solid #dc2626" }}>
          <strong style={{ color: "#dc2626" }}>Error:</strong> {error}
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div style={{ marginTop: "1.25rem", ...card }}>
          <p style={{ marginBottom: 8 }}>Scanning in progress…</p>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ background: "#e5e7eb", borderRadius: 8, overflow: "hidden", height: 16 }}
          >
            <div
              style={{
                width: `${progress}%`,
                background: "#1d4ed8",
                height: "100%",
                transition: "width .3s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <section style={{ marginTop: "2rem" }}>
          {/* Compliance Score (traffic light) */}
          {(() => {
            const total =
              (result.violations?.length || 0) + (result.passes || 0) + (result.incomplete || 0);
            const score =
              total > 0 ? Math.round(((result.passes || 0) / total) * 100) : 0;

            let color = "#dc2626", label = "Poor";
            if (score > 80) { color = "#16a34a"; label = "Good"; }
            else if (score > 50) { color = "#f59e0b"; label = "Fair"; }

            return (
              <div style={{ ...card, marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <h2 style={{ margin: 0 }}>Compliance Score</h2>
                  <strong style={{ fontSize: "1.1rem", color }}>{score}% — {label}</strong>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: 8, overflow: "hidden", height: 22, marginTop: 10 }}>
                  <div style={{
                    width: `${score}%`,
                    background: color,
                    height: "100%",
                    transition: "width .35s ease",
                    textAlign: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 12,
                    lineHeight: "22px",
                  }}>
                    {score}%
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Summary cards */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={statCard} aria-label="Violations">
              <div style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>
                {result.violations?.length || 0}
              </div>
              <div style={{ color: "#475569" }}>Violations</div>
            </div>
            <div style={statCard} aria-label="Passed checks">
              <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>
                {result.passes || 0}
              </div>
              <div style={{ color: "#475569" }}>Passed Checks</div>
            </div>
            <div style={statCard} aria-label="Incomplete checks">
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>
                {result.incomplete || 0}
              </div>
              <div style={{ color: "#475569" }}>Incomplete</div>
            </div>
          </div>

          {/* Download PDF */}
{/* Download PDF */}
<button
  disabled
  style={{
    marginBottom: "1.5rem",
    padding: "10px 20px",
    backgroundColor: "#9ca3af", // gray for disabled
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
    fontWeight: 600,
  }}
>
  Download PDF Report (Coming Soon)
</button>


          {/* Detailed Violations (grouped by impact with colored badges) */}
          {result.raw?.violations?.length > 0 && (
            <div style={{ ...card, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Detailed Accessibility Report</h3>

              {["critical", "serious", "moderate", "minor"].map((level) => {
                const group = (result.raw.violations || []).filter((v) => v.impact === level);
                if (!group.length) return null;

                return (
                  <div key={level} style={{ marginTop: 10, marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={impactStyles[level]}>
                        {level.toUpperCase()}
                      </span>
                      <strong style={{ color: "#334155" }}>
                        {group.length} issue{group.length > 1 ? "s" : ""}
                      </strong>
                    </div>

                    {group.map((v, i) => (
                      <details
                        key={`${level}-${i}`}
                        style={{
                          marginBottom: 10,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          padding: "10px 12px",
                          background: "#f8fafc",
                        }}
                      >
                        <summary style={{ fontWeight: 700, cursor: "pointer", color: "#0f172a" }}>
                          {v.id} — {v.description}
                        </summary>

                        <div style={{ marginTop: 8 }}>
                          <p style={{ margin: "6px 0" }}><strong>Impact:</strong> {v.impact}</p>
                          <p style={{ margin: "6px 0" }}><strong>Suggested fix:</strong> {v.help}</p>
                          {v.helpUrl && (
                            <p style={{ margin: "6px 0" }}>
                              <a href={v.helpUrl} target="_blank" rel="noreferrer">Learn more</a>
                            </p>
                          )}

                          {v.nodes?.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <h4 style={{ margin: "6px 0", fontSize: "1rem" }}>Examples</h4>
                              <ul style={{ paddingLeft: 18 }}>
                                {v.nodes.map((node, j) => (
                                  <li key={j} style={{ marginBottom: 10 }}>
                                    <code style={kbd}>{node.html}</code>
                                    {node.target?.length ? (
                                      <p style={{ margin: "6px 0" }}>
                                        <strong>Target:</strong> {node.target.join(", ")}
                                      </p>
                                    ) : null}
                                    {node.failureSummary && (
                                      <em style={{ color: "#475569" }}>{node.failureSummary}</em>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Incomplete Section */}
          {result.raw?.incomplete?.length > 0 && (
            <div style={{ ...card }}>
              <h3 style={{ marginTop: 0 }}>
                Checks Needing Review <span style={badge("#f59e0b", "#111827")}>{result.raw.incomplete.length}</span>
              </h3>
              {(result.raw.incomplete || []).map((item, i) => (
                <details
                  key={`inc-${i}`}
                  style={{
                    marginBottom: 10,
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "#fff7ed", // light orange
                  }}
                >
                  <summary style={{ fontWeight: 700, cursor: "pointer" }}>
                    {item.id} — {item.description}
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    <p style={{ margin: "6px 0" }}>
                      <strong>Why review is needed:</strong> {item.help}
                    </p>
                    {item.nodes?.length > 0 && (
                      <ul style={{ paddingLeft: 18 }}>
                        {item.nodes.map((node, j) => (
                          <li key={j} style={{ marginBottom: 10 }}>
                            <code style={kbd}>{node.html}</code>
                            {node.target?.length ? (
                              <p style={{ margin: "6px 0" }}>
                                <strong>Target:</strong> {node.target.join(", ")}
                              </p>
                            ) : null}
                            {node.failureSummary && (
                              <em style={{ color: "#475569" }}>{node.failureSummary}</em>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.helpUrl && (
                      <p style={{ margin: "6px 0" }}>
                        <a href={item.helpUrl} target="_blank" rel="noreferrer">Learn more</a>
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Info & Footer */}
      <CountryAccordion />
      <Footer />
    </div>
  );
}
