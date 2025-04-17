import express from "express";
import passport from "passport";
import {
  register,
  registerAdmin,
  login,
  logout,
  getCurrentUser,
  googleAuthCallback,
} from "./auth.controller";

export const authRouter = express.Router();

// Local auth routes
authRouter.post("/register", register);
authRouter.post("/register-admin", registerAdmin);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/current-user", getCurrentUser);

// Google OAuth routes
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/signin",
    session: true,
  }),
  googleAuthCallback
);
