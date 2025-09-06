export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "3rem",
        padding: "2rem",
        background: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#4b5563",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <img
          src="/logo.png"
          alt="Compliance Checker Logo"
          width="40"
          height="40"
          style={{ verticalAlign: "middle" }}
        />
      </div>
      <p>
        Contact us:{" "}
        <a
          href="mailto:support@yourdomain.com"
          style={{ color: "#1d4ed8", fontWeight: "500" }}
        >
          support@yourdomain.com
        </a>
      </p>
      <p style={{ marginTop: "0.5rem" }}>
        &copy; {new Date().getFullYear()} Compliance Checker. All rights
        reserved.
      </p>
    </footer>
  );
}
