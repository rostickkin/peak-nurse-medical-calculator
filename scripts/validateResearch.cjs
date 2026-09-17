const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/data/drugResearch.json");

function validate() {
  console.log("Checking if file exists...");
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  console.log("Reading file...");
  let rawData;
  try {
    rawData = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Error reading file:", err.message);
    process.exit(1);
  }

  console.log("Parsing JSON...");
  let data;
  try {
    data = JSON.parse(rawData);
    console.log("JSON is syntactically valid.");
  } catch (err) {
    console.error("Error: JSON parsing failed!", err.message);
    process.exit(1);
  }

  console.log(`Number of drugs present in research: ${data.length}`);
  const expectedDrugs = ["methylprednisolone", "dexamethasone", "fentanyl", "tramadol", "ceftriaxone"];
  const presentDrugs = data.map(d => d.id);
  console.log("Present drugs IDs:", presentDrugs);

  let errors = [];

  data.forEach((drug, idx) => {
    const drugContext = `Drug #${idx + 1} (${drug.genericName || "Unnamed"})`;
    if (!drug.id) errors.push(`${drugContext}: Missing 'id'`);
    if (!drug.genericName) errors.push(`${drugContext}: Missing 'genericName'`);
    if (!drug.category) errors.push(`${drugContext}: Missing 'category'`);
    if (!Array.isArray(drug.brandNames)) errors.push(`${drugContext}: 'brandNames' should be an array`);
    if (!Array.isArray(drug.availableStrengths)) errors.push(`${drugContext}: 'availableStrengths' should be an array`);

    if (!Array.isArray(drug.indications)) {
      errors.push(`${drugContext}: 'indications' should be an array`);
      return;
    }

    drug.indications.forEach((ind, indIdx) => {
      const indContext = `${drugContext} -> Indication #${indIdx + 1} (${ind.id || "Unnamed"})`;
      if (!ind.id) errors.push(`${indContext}: Missing 'id'`);
      if (!ind.name || !ind.name.en) errors.push(`${indContext}: Missing English name`);

      if (!Array.isArray(ind.protocols)) {
        errors.push(`${indContext}: 'protocols' should be an array`);
        return;
      }

      ind.protocols.forEach((prot, protIdx) => {
        const protContext = `${indContext} -> Protocol #${protIdx + 1} (${prot.id || "Unnamed"})`;
        if (!prot.id) errors.push(`${protContext}: Missing 'id'`);
        if (!prot.population) errors.push(`${protContext}: Missing 'population'`);
        if (!["adult", "pediatric"].includes(prot.population)) {
          errors.push(`${protContext}: 'population' must be 'adult' or 'pediatric'`);
        }
        if (!prot.route) errors.push(`${protContext}: Missing 'route'`);
        if (!prot.doseType) errors.push(`${protContext}: Missing 'doseType'`);
        
        // Check calculation and rules
        if (!prot.calculation || !Array.isArray(prot.calculation.rules)) {
          errors.push(`${protContext}: Missing calculation rules array`);
        } else {
          prot.calculation.rules.forEach((rule, rIdx) => {
            if (!rule.condition) errors.push(`${protContext} -> Rule #${rIdx + 1}: Missing 'condition'`);
            if (!rule.formula) errors.push(`${protContext} -> Rule #${rIdx + 1}: Missing 'formula'`);
          });
        }

        // Check required inputs
        if (!Array.isArray(prot.requiredInputs)) {
          errors.push(`${protContext}: Missing 'requiredInputs' array`);
        } else {
          prot.requiredInputs.forEach((input, iIdx) => {
            if (!input.id) errors.push(`${protContext} -> Input #${iIdx + 1}: Missing 'id'`);
            if (!input.label || !input.label.en) errors.push(`${protContext} -> Input #${iIdx + 1}: Missing English label`);
          });
        }

        // Verify weight based protocol has weight input
        if (prot.doseType === "weight_based") {
          const hasWeight = prot.requiredInputs && prot.requiredInputs.some(i => i.id === "weight");
          if (!hasWeight) {
            errors.push(`${protContext}: Is weight_based but lacks 'weight' in requiredInputs`);
          }
        }

        // Verify sources
        if (!Array.isArray(prot.sources) || prot.sources.length === 0) {
          errors.push(`${protContext}: Must have at least one source`);
        } else {
          prot.sources.forEach((src, sIdx) => {
            if (!src.title) errors.push(`${protContext} -> Source #${sIdx + 1}: Missing 'title'`);
            if (!src.organization) errors.push(`${protContext} -> Source #${sIdx + 1}: Missing 'organization'`);
          });
        }

        // Verify verification status
        if (!prot.verificationStatus) {
          errors.push(`${protContext}: Missing 'verificationStatus'`);
        }
      });
    });
  });

  if (errors.length > 0) {
    console.error(`\nValidation FAILED with ${errors.length} errors:`);
    errors.forEach(err => console.error(` - ${err}`));
    process.exit(1);
  } else {
    console.log("\nValidation PASSED successfully! No structural errors found.");
  }
}

validate();
