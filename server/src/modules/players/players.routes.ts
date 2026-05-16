import { Router } from "express";
import {
  getPlayerByIdController,
  getPlayersController
} from "./players.controller";

export const playersRouter = Router();

playersRouter.get("/", getPlayersController);
playersRouter.get("/:id", getPlayerByIdController);