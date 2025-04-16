import express from "express";
import { login, register, registerAdmin } from "./auth.controller";

export const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

// consider adding middleware here to check if user is admin
authRouter.post("/register-admin", registerAdmin);
