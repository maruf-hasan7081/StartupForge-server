import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { getAuth } from "./auth.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import startupRoutes from "./routes/startupRoutes.js";
import opportunityRoutes from "./routes/opportunityRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

await connectDb();
const auth = getAuth();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "StartupForge API" });
});

app.use("/api/config", configRoutes);
app.use("/api/session", authRoutes);
app.all("/api/auth/*", toNodeHandler(auth));
app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
