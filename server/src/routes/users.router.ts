import express from "express";
import { updateUserProfile } from "./users.controller";
import { isAuthenticated } from "../utils/auth";

export const usersRouter = express.Router();

usersRouter.use(isAuthenticated);

usersRouter.patch("/:id", updateUserProfile);
