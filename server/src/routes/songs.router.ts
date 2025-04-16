import express from "express";
import { getAllSongs } from "./songs.controller";

export const songsRouter = express.Router();

songsRouter.get("/", getAllSongs);
