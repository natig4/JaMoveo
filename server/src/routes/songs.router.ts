import express from "express";
import {
  getAllSongs,
  getSongById,
  addSong,
  searchSongs,
} from "./songs.controller";
import { isAdmin } from "../utils/auth";

export const songsRouter = express.Router();

songsRouter.get("/search", isAdmin, searchSongs);

songsRouter.get("/:id", getSongById);

songsRouter.use(isAdmin);

songsRouter.get("/", getAllSongs);

songsRouter.post("/", addSong);
