import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "./config/db.js";
import { env } from "./config/env.js";

let authInstance;

export function getAuth() {
  if (authInstance) return authInstance;

  const db = getDb();
  const socialProviders = {};

  if (env.googleClientId && env.googleClientSecret) {
    socialProviders.google = {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    };
  }

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: env.betterAuthSecret,
    baseURL: env.betterAuthUrl,
    trustedOrigins: [env.clientUrl],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    socialProviders,
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "collaborator",
          input: true,
        },
        isBlocked: {
          type: "boolean",
          required: false,
          defaultValue: false,
        },
        skills: {
          type: "string",
          required: false,
        },
        bio: {
          type: "string",
          required: false,
        },
        isPremium: {
          type: "boolean",
          required: false,
          defaultValue: false,
        },
        hasSelectedRole: {
          type: "boolean",
          required: false,
          defaultValue: false,
        },
      },
    },
  });

  return authInstance;
}
