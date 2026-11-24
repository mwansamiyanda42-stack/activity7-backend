require("dotenv").config();
const fs = require("fs");
const pool = require("./db");

(async () => {
  await pool.query(fs.readFileSync("schema.sql", "utf8"));
  const { rows } = await pool.query("SELECT COUNT(*) FROM records");
  if (rows[0].count === "0") await pool.query(fs.readFileSync("seed.sql", "utf8"));
  const after = await pool.query("SELECT COUNT(*) FROM records");
  console.log("Done. Rows:", after.rows[0].count);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });