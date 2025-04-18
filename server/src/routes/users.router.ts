import express from "express";
import {
  updateUserProfile,
  updateUserGroup,
  getAllGroups,
} from "./users.controller";
import { isAuthenticated } from "../utils/auth";

export const usersRouter = express.Router();

usersRouter.use(isAuthenticated);

usersRouter.patch("/:id", updateUserProfile);
usersRouter.patch("/:id/group", updateUserGroup);
usersRouter.get("/groups", getAllGroups);
