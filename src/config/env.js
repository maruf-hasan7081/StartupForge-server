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

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri,
  betterAuthSecret,
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  clientUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  clientOrigins: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  adminEmail: process.env.ADMIN_EMAIL || "admin@startupforge.com",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin@123",
};
