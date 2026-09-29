import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "./config/db.js";
import { env } from "./config/env.js";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "./utils/password.js";

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
    trustedOrigins: env.clientOrigins.length ? env.clientOrigins : [env.clientUrl],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const password = ctx.body?.password;
          if (password && !isValidPassword(password)) {
            throw new APIError("BAD_REQUEST", { message: PASSWORD_REQUIREMENTS_MESSAGE });
          }
        }
        if (ctx.path === "/sign-in/email") {
          const email = ctx.body?.email;
          if (email) {
            const user = await db.collection("user").findOne({ email });
            if (user?.isBlocked) {
              throw new APIError("FORBIDDEN", { message: "Account blocked" });
            }
          }
        }
      }),
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
