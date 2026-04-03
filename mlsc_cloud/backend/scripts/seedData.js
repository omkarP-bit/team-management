require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const XLSX = require("xlsx");
const { upsertTeam } = require("../src/services/credentialStore");

const EXCEL_FILE = path.join(__dirname, "..", "data", "CloudWar-S3.xlsx");

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

(async () => {
  let rows;
  try {
    rows = parseExcel(EXCEL_FILE);
  } catch (err) {
    console.error("Failed to read Excel file:", err.message);
    process.exitCode = 1;
    return;
  }

  if (rows.length === 0) {
    console.error("No rows found in the Excel file.");
    process.exitCode = 1;
    return;
  }

  let inserted = 0;
  let failed = 0;

  for (const row of rows) {
    const code = String(row["Teams"] ?? "").trim().padStart(4, "0");
    const url = String(row["URL"] ?? "").trim() || String(rows.find(r => r["URL"])?.URL ?? "").trim();
    const username = String(row["Username"] ?? "").trim();
    const password = String(row["Password"] ?? "").trim();

    if (!code || !username || !password) {
      console.warn(`Skipping invalid row:`, row);
      failed++;
      continue;
    }

    try {
      await upsertTeam({ code, team_name: code, url, username, password, team_size: 4, members: [] });
      console.log(`✓ Seeded team: ${code}`);
      inserted++;
    } catch (err) {
      console.error(`✗ Failed to seed team ${code}:`, err.message);
      failed++;
    }
  }

  console.log(`\nSeed complete — inserted: ${inserted}, failed: ${failed}`);
})();
