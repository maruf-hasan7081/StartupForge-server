import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.resolve(__dirname, "../../.env");

// Local dev: optional server/.env file. Production (Render, etc.): use process.env from the host.
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (!process.env.RENDER) {
  dotenv.config();
}

function envHint() {
  if (process.env.RENDER) {
    return "Set variables in Render → your Web Service → Environment.";
  }
  return "Set them in server/.env (see .env.example) or export them in your shell.";
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    return null;
  }
  return value;
}

const requiredNames = ["MONGODB_URI", "BETTER_AUTH_SECRET", "JWT_SECRET"];
const missing = requiredNames.filter((name) => !requireEnv(name));

if (missing.length) {
  console.error(
    `\nMissing required environment variable(s): ${missing.join(", ")}\n` +
      `${envHint()}\n`,
  );
  process.exit(1);
}

const mongoUri = requireEnv("MONGODB_URI");
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const jwtSecret = requireEnv("JWT_SECRET");

if (mongoUri.includes("USER:PASSWORD") || mongoUri.includes("user:pass@")) {
  console.error(
    "\nMONGODB_URI looks like a placeholder. Use your real MongoDB Atlas connection string.\n" +
      `${envHint()}\n`,
  );
  process.exit(1);
}

const clientUrlFromEnv = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const isProduction = process.env.NODE_ENV === "production";
const clientOrigins = isProduction
  ? clientUrlFromEnv
  : [...new Set([...clientUrlFromEnv, ...localDevOrigins])];

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri,
  betterAuthSecret,
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  clientUrl: clientUrlFromEnv[0] || "http://localhost:5173",
  clientOrigins,
  jwtSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  adminEmail: process.env.ADMIN_EMAIL || "admin@startupforge.com",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@123",
};
