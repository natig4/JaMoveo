import express from "express";
import { getAllSongs, searchSongs } from "./songs.controller";

export const songsRouter = express.Router();

songsRouter.get("/", getAllSongs);
songsRouter.get("/search", searchSongs);
