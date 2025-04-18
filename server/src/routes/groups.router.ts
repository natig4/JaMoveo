import express from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  getGroupUsers,
  checkGroupName,
} from "./groups.controller";
import { isAuthenticated, isAdmin } from "../utils/auth";

export const groupsRouter = express.Router();

groupsRouter.get("/check-name", checkGroupName);

groupsRouter.use(isAuthenticated);

groupsRouter.get("/", getAllGroups);
groupsRouter.get("/:id", getGroupById);
groupsRouter.get("/:id/users", getGroupUsers);

groupsRouter.post("/", isAdmin, createGroup);
