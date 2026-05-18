import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

let hasLoggedDisabledGuard = false;

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.adminApiKey) {
    if (!hasLoggedDisabledGuard) {
      console.log("Admin API key guard is disabled because ADMIN_API_KEY is not configured.");
      hasLoggedDisabledGuard = true;
    }

    next();
    return;
  }

  const providedApiKey = req.header("x-admin-api-key");

  if (providedApiKey !== env.adminApiKey) {
    res.status(401).json({
      success: false,
      message: "Unauthorized admin request"
    });
    return;
  }

  next();
}
