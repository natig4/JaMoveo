import { Request, Response } from "express";
import { users } from "../models/users.model";

export function getAllUsers(req: Request, res: Response): void {
  res.status(200).json(users);
  return;
}
