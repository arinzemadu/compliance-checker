import { useParams } from "react-router-dom";
import complianceMapping from "../data/complianceMapping.json";

export default function CompliancePage() {
  const { country } = useParams();
  const info = complianceMapping[country.replace("-", " ")] || null;

  if (!info) {
    return <p>Compliance information not found for {country}.</p>;
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 900, margin: "auto" }}>
      <h1>Accessibility Compliance in {country}</h1>
      <p><strong>{info.standard}</strong></p>
      <p>{info.description}</p>
      <a href="/">← Back to Scanner</a>
    </div>
  );
}

