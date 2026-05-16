import { Request, Response } from "express";
import { createEarning } from "./earnings.service";

export function createEarningController(req: Request, res: Response) {
  const { playerId, amount } = req.body;

  if (!playerId || typeof playerId !== "string") {
    return res.status(400).json({
      success: false,
      message: "playerId is required"
    });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "amount must be a positive number"
    });
  }

  const earning = createEarning(playerId, amount);

  return res.status(201).json({
    success: true,
    data: earning
  });
}