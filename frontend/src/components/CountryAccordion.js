import { useState } from "react";
import complianceMapping from "../data/complianceMapping.json";

export default function CountryAccordion() {
  const [openCountry, setOpenCountry] = useState(null);

  return (
    <section style={{ marginTop: "3rem" }}>
      <h2>🌍 Accessibility Laws by Country</h2>
      {Object.entries(complianceMapping).map(([country, info]) => (
        <div
          key={country}
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            marginBottom: "0.5rem",
            background: "#fff"
          }}
        >
          <button
            onClick={() => setOpenCountry(openCountry === country ? null : country)}
            style={{
              width: "100%",
              padding: "10px",
              textAlign: "left",
              fontWeight: "bold",
              background: "#f1f5f9",
              border: "none",
              cursor: "pointer"
            }}
          >
            {country}
          </button>
          {openCountry === country && (
            <div style={{ padding: "10px" }}>
              <p><strong>{info.standard}</strong></p>
              <p>{info.description}</p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
