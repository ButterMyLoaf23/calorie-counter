import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const fdcApiKey = process.env.FDC_API_KEY;
const fdcBaseUrl = "https://api.nal.usda.gov/fdc/v1";

if (!fdcApiKey) console.warn("FDC_API_KEY is not configured. USDA search will return an error until it is set.");

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many API requests. Please try again later." } });

function validPage(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "calorie-counter" }));

app.get("/api/usda/search", apiLimiter, async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (query.length < 2 || query.length > 120) return res.status(400).json({ error: "Search must be between 2 and 120 characters." });

  const pageSize = validPage(req.query.pageSize, 25, 50);
  const pageNumber = validPage(req.query.pageNumber, 1, 1000);
  const params = new URLSearchParams({ query, pageSize: String(pageSize), pageNumber: String(pageNumber), api_key: fdcApiKey || "" });
  if (typeof req.query.dataType === "string" && req.query.dataType.trim()) params.set("dataType", req.query.dataType.slice(0, 100));

  try {
    const response = await fetch(`${fdcBaseUrl}/foods/search?${params}`, { signal: AbortSignal.timeout(8000) });
    const body = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: "USDA search is temporarily unavailable." });
    res.json(body);
  } catch (error) {
    console.error("USDA search error:", error.message);
    res.status(502).json({ error: "Unable to reach USDA FoodData Central." });
  }
});

app.get("/api/usda/food/:fdcId", apiLimiter, async (req, res) => {
  if (!/^\d+$/.test(req.params.fdcId)) return res.status(400).json({ error: "Invalid food ID." });
  const params = new URLSearchParams({ api_key: fdcApiKey || "" });
  try {
    const response = await fetch(`${fdcBaseUrl}/food/${req.params.fdcId}?${params}`, { signal: AbortSignal.timeout(8000) });
    const body = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: "USDA food details are temporarily unavailable." });
    res.json(body);
  } catch (error) {
    console.error("USDA detail error:", error.message);
    res.status(502).json({ error: "Unable to reach USDA FoodData Central." });
  }
});

app.use(express.static(__dirname, { extensions: ["html"] }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, () => console.log(`Calorie Counter running at http://localhost:${port}`));
