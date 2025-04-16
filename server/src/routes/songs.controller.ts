import { Request, Response } from "express";
import * as SongsService from "../services/songs.service";

export async function getAllSongs(_req: Request, res: Response): Promise<void> {
  try {
    const songs = SongsService.getAllSongs();
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error getting songs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve songs",
    });
  }
}

export async function getSongById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const song = SongsService.getSongById(id);

    if (!song) {
      res.status(404).json({
        success: false,
        message: "Song not found",
      });
      return;
    }

    res.status(200).json(song);
  } catch (error) {
    console.error("Error getting song:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve song",
    });
  }
}

export async function addSong(req: Request, res: Response): Promise<void> {
  try {
    const songData = req.body;

    if (!songData.title || !songData.artist || !songData.data) {
      res.status(400).json({
        success: false,
        message: "Title, artist, and data are required",
      });
      return;
    }

    const newSong = await SongsService.addSong(songData);
    res.status(201).json(newSong);
  } catch (error) {
    console.error("Error adding song:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add song",
    });
  }
}

export async function searchSongs(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    const results = SongsService.searchSongs(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching songs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search songs",
    });
  }
}
