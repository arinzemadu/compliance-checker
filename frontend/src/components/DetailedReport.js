export default function DetailedReport({ violations }) {
  if (!violations || violations.length === 0) {
    return <p style={{ marginTop: "2rem" }}>✅ No accessibility violations found.</p>;
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h3>Detailed Accessibility Report</h3>
      {violations.map((v, i) => (
        <div
          key={i}
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: "#fff",
          }}
        >
          {/* Title */}
          <h4 style={{ marginBottom: "0.5rem" }}>
            {v.id}{" "}
            <span
              style={{
                fontSize: "0.85rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background:
                  v.impact === "critical"
                    ? "#dc2626"
                    : v.impact === "serious"
                    ? "#f97316"
                    : v.impact === "moderate"
                    ? "#eab308"
                    : "#6b7280",
                color: "white",
              }}
            >
              {v.impact || "N/A"}
            </span>
          </h4>

          {/* Description */}
          <p>{v.description}</p>

          {/* Suggested Fix */}
          <p>
            <strong>Suggested fix:</strong> {v.help}
          </p>

          {/* Reference */}
          {v.helpUrl && (
            <p>
              <a href={v.helpUrl} target="_blank" rel="noreferrer">
                Learn more
              </a>
            </p>
          )}

          {/* Examples */}
          {v.nodes?.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <h5>Examples of failing elements:</h5>
              <ul>
                {v.nodes.map((node, j) => (
                  <li key={j} style={{ marginBottom: "0.75rem" }}>
                    <code
                      style={{
                        display: "block",
                        background:
