import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

let hasLoggedDisabledGuard = false;

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const configuredKey = env.adminApiKey?.trim();

  if (!configuredKey) {
    if (!hasLoggedDisabledGuard) {
      console.log("Admin API key guard is disabled because ADMIN_API_KEY is not configured.");
      hasLoggedDisabledGuard = true;
    }

    next();
    return;
  }

  const providedKey = req.header("x-admin-api-key")?.trim();

  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({
      success: false,
      message: "Unauthorized admin request"
    });
    return;
  }

  next();
}
