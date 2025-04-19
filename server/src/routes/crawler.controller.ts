import { Request, Response } from "express";
import { crawlPopularSongs } from "../services/crawler.service";

export async function getPopularSongs(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 20) {
      res.status(400).json({
        success: false,
        message:
          "Invalid page or limit parameters. Page must be >= 1, limit must be between 1 and 20",
      });
      return;
    }

    const result = await crawlPopularSongs(limit);

    res.status(200).json({
      success: true,
      songs: result.songs,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error getting popular songs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular songs",
    });
  }
}
