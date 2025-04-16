import { Request, Response } from "express";
import { songs } from "../models/songs.model";

export function getAllSongs(req: Request, res: Response): void {
  res.status(200).json(songs);
  return;
}

// TODO: add songs via crawler
// TODO: search for song
