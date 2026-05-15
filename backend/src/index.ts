import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import { polarWebhookHandler } from "./webhooks/polar";

import path from "path";
import fs from "fs";

import * as Sentry from "@sentry/node";

import { sentryClerkUserMiddleware } from "./middleware/sentryClerkUser";
import { getEnv } from "./lib/env";
import keepAliveCron from "./lib/cron";

import meRoute from "./routes/meRoute";
import productRoute from "./routes/productRoute";
import streamRoute from "./routes/streamRoute";
import checkoutRoute from "./routes/checkoutRoute";
import adminRoute from "./routes/adminRoute";
import orderRoute from "./routes/orderRoute";

const env = getEnv();
const app = express();

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.post("/webhooks/polar", rawJson, (req, res) => {
  void polarWebhookHandler(req, res);
});

app.use("/api/me", meRoute);
app.use("/api/products", productRoute);
app.use("/api/stream", streamRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/admin", adminRoute);
app.use("/api/orders", orderRoute);

const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
      next();
      return;
    }

    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
}

Sentry.setupExpressErrorHandler(app);

app.use(
  (_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const sentryId = (res as express.Response & { sentry?: string }).sentry;

    res.status(500).json({
      error: "Internal server error",
      ...(sentryId !== undefined && { sentryId }),
    });
  },
);

app.listen(env.PORT, () => {
  console.log(`Server is running on: http://localhost:${env.PORT}`);
  if (env.NODE_ENV === "production") {
    keepAliveCron.start();
  }
});