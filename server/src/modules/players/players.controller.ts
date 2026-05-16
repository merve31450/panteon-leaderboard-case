import { Request, Response } from "express";
import { getPlayerById, getPlayers } from "./players.service";

export function getPlayersController(_req: Request, res: Response) {
  const players = getPlayers();

  return res.json({
    success: true,
    data: players
  });
}

export function getPlayerByIdController(req: Request, res: Response) {
  const id = String(req.params.id);

  const player = getPlayerById(id);

  if (!player) {
    return res.status(404).json({
      success: false,
      message: "Player not found"
    });
  }

  return res.json({
    success: true,
    data: player
  });
}