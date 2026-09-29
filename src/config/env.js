import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `\nMissing ${name} in server/.env\n` +
        "Copy server/.env.example to server/.env and set all required values.\n",
    );
    process.exit(1);
  }
  return value;
}

const mongoUri = requireEnv("MONGODB_URI");
const betterAuthSecret = requireEnv("BETTER_AUTH_SECRET");
const jwtSecret = requireEnv("JWT_SECRET");

if (mongoUri.includes("USER:PASSWORD")) {
  console.error(
    "\nUpdate MONGODB_URI in server/.env with your real MongoDB Atlas credentials.\n" +
      "Atlas: Database → Connect → Drivers → copy the connection string.\n",
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
