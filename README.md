# 📄 `README.md`

```markdown
# Compliance Checker

Compliance Checker is a web application that scans websites for **accessibility compliance** based on the [WCAG 2.1 AA guidelines](https://www.w3.org/TR/WCAG21/).  

The tool is designed to help **small businesses, developers, and agencies** quickly identify accessibility issues that may expose them to:  

- ⚖️ **ADA lawsuits** (United States)  
- ⚖️ **Equality Act requirements** (United Kingdom)  
- ⚖️ **EU accessibility laws**  

This free version provides a **homepage scan** with compliance score, summary, and WCAG checklist. A paid version could expand to **full-site scans, detailed remediation advice, and downloadable reports**.  

---

## 🚀 Features

- Simple input: Enter a website URL → run scan  
- Automated accessibility testing using **axe-core** + Puppeteer  
- WCAG 2.1 AA compliance summary (Pass / Fail / Needs Review)  
- Compliance score bar + key findings cards  
- Mobile-friendly report table  
- Educational section: *Why Accessibility Matters*  
- SEO + accessibility optimized frontend  

---

## 🛠️ Tech Stack

- **Frontend**: React (Create React App)  
- **Backend**: Node.js + Express + Puppeteer + axe-core  
- **Accessibility Engine**: axe-core  
- **Styling**: Inline CSS (lightweight, mobile-first)  

---

## 📂 Project Structure

```

compliance-scanner/
│
├── backend/                        # Node.js API server
│   ├── server.js                   # Express server with scan route
│   ├── wcagChecklist.json          # WCAG 2.1 AA success criteria
│   ├── wcagChecklist.js            # Helper to map axe-core → WCAG
│   └── package.json
│
├── frontend/                       # React frontend
│   ├── public/
│   │   └── index.html              # Meta tags (SEO)
│   ├── src/
│   │   ├── App.js                  # App entry
│   │   ├── components/
│   │   │   └── LandingPage.js      # Main UI
│   │   └── styles/                 # Optional styles
│   └── package.json
│
└── README.md

````

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/compliance-checker.git
cd compliance-checker
````

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Run the backend server:

```bash
npm start
```

By default, it runs on **[http://localhost:4000](http://localhost:4000)**.

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Run the React development server:

```bash
npm start
```

By default, it runs on **[http://localhost:3000](http://localhost:3000)**.

---

### 4. Usage

1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Enter a website URL (e.g., `https://example.com`).
3. Click **Start Free Accessibility Scan**.
4. The backend will fetch the page, run accessibility checks, and return:

   * ✅ Passed checks
   * ❌ Violations found
   * ⚠️ Incomplete/manual review checks
   * 📊 Compliance score (percentage)
   * 📋 WCAG 2.1 AA results table (Pass / Fail / Needs Review)

---

## 🔮 Roadmap

* [ ] Detailed issue-level reports (HTML snippets, remediation advice)
* [ ] Export to PDF / CSV
* [ ] Multi-page & full-site scans
* [ ] Authentication + user dashboards
* [ ] Paid version with GDPR / HIPAA compliance scanning

---

## 📜 License

MIT License — free to use and adapt.

---

## 🙌 Acknowledgments

* [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems
* [Puppeteer](https://pptr.dev/) for headless browsing
* [W3C WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)

```


