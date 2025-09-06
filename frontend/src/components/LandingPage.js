import { useState } from "react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setProgress(0);

    if (!url.startsWith("http")) {
      setError("Please enter a valid URL starting with http or https.");
      return;
    }

    setLoading(true);
    let progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 400);

    try {
      const response = await fetch("https://compliance-checker-be.onrender.com/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, country }),
      });
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

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "2rem", maxWidth: "1100px", margin: "auto" }}>
      {/* Header */}
      <h1 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold", color: "#1d4ed8" }}>
        ADA & WCAG Website Accessibility Compliance Checker
      </h1>
      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "1.1rem" }}>
        Scan your website for <strong>ADA compliance (US)</strong>,{" "}
        <strong>WCAG 2.1 standards (UK & EU)</strong>, and{" "}
        <strong>accessibility best practices worldwide</strong>.  
        Free single-page scans. Upgrade for full reports, PDF exports, and
        scheduled compliance checks.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "2rem",
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <input
          type="text"
          placeholder="Enter website URL (https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            marginBottom: "10px",
            border: "1px solid #ddd",
            borderRadius: "6px",
          }}
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            marginBottom: "10px",
            border: "1px solid #ddd",
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
            padding: "12px 24px",
            backgroundColor: "#1d4ed8",
            color: "white",
            fontWeight: "600",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {loading ? "Scanning..." : "Start Scan"}
        </button>
      </form>

      {/* Errors */}
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {/* Progress */}
      {loading && (
        <div style={{ marginTop: "1.5rem" }}>
          <p>Scanning in progress...</p>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ background: "#e5e7eb", borderRadius: "6px", overflow: "hidden", height: "20px" }}
          >
            <div
              style={{
                width: `${progress}%`,
                background: "#1d4ed8",
                height: "100%",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <section style={{ marginTop: "2rem" }}>
          {/* Compliance Score */}
          {(() => {
            const total =
              (result.violations?.length || 0) +
              (result.passes || 0) +
              (result.incomplete || 0);
            const score =
              total > 0 ? Math.round(((result.passes || 0) / total) * 100) : 0;

            let scoreColor = "#dc2626"; // red
            let scoreLabel = "Poor";
            if (score > 80) {
              scoreColor = "#16a34a"; // green
              scoreLabel = "Good";
            } else if (score > 50) {
              scoreColor = "#f59e0b"; // orange
              scoreLabel = "Fair";
            }

            return (
              <div
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  marginBottom: "2rem",
                }}
              >
                <h2>Compliance Score</h2>
                <div
                  style={{
                    background: "#e5e7eb",
                    borderRadius: "6px",
                    overflow: "hidden",
                    height: "25px",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: `${score}%`,
                      background: scoreColor,
                      height: "100%",
                      textAlign: "center",
                      color: "white",
                      fontWeight: "bold",
                      lineHeight: "25px",
                    }}
                  >
                    {score}% – {scoreLabel}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Summary */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "2rem",
            }}
          >
            <div className="card">
              <strong style={{ fontSize: "1.2rem", color: "#dc2626" }}>
                {result.violations?.length || 0}
              </strong>
              <p>Violations</p>
            </div>
            <div className="card">
              <strong style={{ fontSize: "1.2rem", color: "#16a34a" }}>
                {result.passes || 0}
              </strong>
              <p>Passed Checks</p>
            </div>
            <div className="card">
              <strong style={{ fontSize: "1.2rem", color: "#f59e0b" }}>
                {result.incomplete || 0}
              </strong>
              <p>Incomplete</p>
            </div>
          </div>

          {/* Violations */}
          {result.raw?.violations?.length > 0 && (
            <div className="card">
              <h3>Detailed Accessibility Report</h3>
              {["critical", "serious", "moderate", "minor"].map((level) => {
                const group = result.raw.violations.filter(
                  (v) => v.impact === level
                );
                if (group.length === 0) return null;

                return (
                  <div key={level} style={{ marginBottom: "1.5rem" }}>
                    <h4 style={{ textTransform: "capitalize" }}>
                      {level} Issues ({group.length})
                    </h4>
                    {group.map((v, i) => (
                      <details
                        key={i}
                        style={{
                          marginBottom: "1rem",
                          padding: "1rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          background: "#f9fafb",
                        }}
                      >
                        <summary style={{ fontWeight: "600", cursor: "pointer" }}>
                          {v.id} – {v.description}
                        </summary>
                        <p><strong>Impact:</strong> {v.impact}</p>
                        <p><strong>Suggested fix:</strong> {v.help}</p>
                        {v.helpUrl && (
                          <p>
                            <a href={v.helpUrl} target="_blank" rel="noreferrer">
                              Learn more
                            </a>
                          </p>
                        )}
                        {v.nodes?.length > 0 && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <h5>Examples:</h5>
                            <ul>
                              {v.nodes.map((node, j) => (
                                <li key={j} style={{ marginBottom: "0.75rem" }}>
                                  <code
                                    style={{
                                      display: "block",
                                      background: "#f3f4f6",
                                      padding: "4px",
                                      borderRadius: "4px",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {node.html}
                                  </code>
                                  <p><strong>Target:</strong> {node.target?.join(", ")}</p>
                                  <em>{node.failureSummary}</em>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </details>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Incomplete */}
          {result.raw?.incomplete?.length > 0 && (
            <div className="card" style={{ marginTop: "2rem" }}>
              <h3>Checks Needing Review ({result.raw.incomplete.length})</h3>
              {result.raw.incomplete.map((item, i) => (
                <details
                  key={i}
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    background: "#fff7ed",
                  }}
                >
                  <summary style={{ fontWeight: "600", cursor: "pointer" }}>
                    {item.id} – {item.description}
                  </summary>
                  <p><strong>Impact:</strong> {item.impact || "Needs review"}</p>
                  <p><strong>Why review is needed:</strong> {item.help}</p>
                  {item.helpUrl && (
                    <p>
                      <a href={item.helpUrl} target="_blank" rel="noreferrer">
                        Learn more
                      </a>
                    </p>
                  )}
                  {item.nodes?.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <h5>Examples:</h5>
                      <ul>
                        {item.nodes.map((node, j) => (
                          <li key={j} style={{ marginBottom: "0.75rem" }}>
                            <code
                              style={{
                                display: "block",
                                background: "#f3f4f6",
                                padding: "4px",
                                borderRadius: "4px",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {node.html}
                            </code>
                            <p><strong>Target:</strong> {node.target?.join(", ")}</p>
                            <em>{node.failureSummary}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
              ))}
            </div>
          )}
        </section>
      )}



  {/* Existing content */}
  <CountryAccordion />
  <Footer />
    </div>
  );
}
