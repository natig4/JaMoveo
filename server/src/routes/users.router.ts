import express from "express";
import { getAllUsers } from "./users.controller";

export const usersRouter = express.Router();

usersRouter.get("/", getAllUsers);

// TODO: add sign-up and sign-in
