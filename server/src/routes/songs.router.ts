import express from "express";
import {
  getAllSongs,
  getSongById,
  addSong,
  searchSongs,
} from "./songs.controller";
import { isAdmin } from "../utils/auth";

export const songsRouter = express.Router();

songsRouter.get("/", isAdmin, getAllSongs);

songsRouter.get("/search", isAdmin, searchSongs);

songsRouter.get("/:id", isAdmin, getSongById);

songsRouter.post("/", isAdmin, addSong);
