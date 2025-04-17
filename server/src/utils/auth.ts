import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { IUser, UserRole } from "../models/types";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (
    req.isAuthenticated() &&
    req.user &&
    (req.user as IUser).role === UserRole.ADMIN
  ) {
    return next();
  }
  res.status(403).json({ success: false, message: "Forbidden" });
}
