import express from "express";
import {
  getAllSongs,
  getSongById,
  addSong,
  searchSongs,
} from "./songs.controller";
import { isAdmin } from "../utils/auth";

export const songsRouter = express.Router();

songsRouter.get("/:id", getSongById);

songsRouter.use(isAdmin);

songsRouter.get("/", getAllSongs);

songsRouter.get("/search", searchSongs);

songsRouter.post("/", addSong);
