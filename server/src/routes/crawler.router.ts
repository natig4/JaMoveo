import express from "express";
import { getPopularSongs } from "./crawler.controller";
import { isAdmin } from "../utils/auth";

export const crawlerRouter = express.Router();

crawlerRouter.use(isAdmin);

crawlerRouter.get("/popular-songs", getPopularSongs);
