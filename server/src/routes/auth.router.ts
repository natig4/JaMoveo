import express from "express";
import {
  register,
  registerAdmin,
  login,
  logout,
  getCurrentUser,
} from "./auth.controller";
import { isAdmin, isAuthenticated } from "../utils/auth";

export const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

authRouter.get("/current-user", isAuthenticated, getCurrentUser);

// later think on how to add this: isAdmin
authRouter.post("/register-admin", registerAdmin);
