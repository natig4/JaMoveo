import express from "express";
import {
  getAllSongs,
  getSongById,
  addSong,
  searchSongs,
} from "./songs.controller";
import { isAdmin } from "../utils/auth";

export const songsRouter = express.Router();

songsRouter.use(isAdmin);

songsRouter.get("/", getAllSongs);

songsRouter.get("/search", searchSongs);

songsRouter.get("/:id", getSongById);

songsRouter.post("/", addSong);
