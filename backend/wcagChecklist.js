const wcagChecklist = require("./wcagChecklist.json");

function normalizeId(id) {
  // "1.4.3" → "wcag143"
  return "wcag" + id.replace(/\./g, "");
}

function mapResults(axeResults) {
  return wcagChecklist.map((criterion) => {
    const tag = normalizeId(criterion.id);

    const violation = axeResults.violations.find((v) =>
      v.tags.includes(tag)
    );
    const pass = axeResults.passes.find((p) =>
      p.tags.includes(tag)
    );

    let status = "Needs Review";
    if (violation) status = "Fail";
    else if (pass) status = "Pass";

    return {
      id: criterion.id,
      name: criterion.name,
      status,
    };
  });
}

module.exports = { wcagChecklist, mapResults };
