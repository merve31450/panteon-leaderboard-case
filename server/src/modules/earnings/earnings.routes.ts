import { Router } from "express";
import { createEarningController } from "./earnings.controller";

export const earningsRouter = Router();

earningsRouter.post("/", createEarningController);