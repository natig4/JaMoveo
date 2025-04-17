import { Request, Response } from "express";
import * as UsersService from "../services/users.service";

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const userId = req.params.id;
    const userData = req.body;
    
    // Ensure user can only update their own profile
    if (userId !== (req.user as any).id) {
      res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
      return;
    }

    const updatedUser = await UsersService.updateUser(userId, userData);
    
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}