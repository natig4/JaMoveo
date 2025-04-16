import { Request, Response } from "express";
import * as UsersService from "../services/users.service";

export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = UsersService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
}

export async function addUser(req: Request, res: Response): Promise<void> {
  try {
    const userData = req.body;

    if (!userData.username) {
      res.status(400).json({
        success: false,
        message: "Username is required",
      });
      return;
    }

    const newUser = await UsersService.addUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof Error && error.message === "Username already exists") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Error adding user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add user",
    });
  }
}
