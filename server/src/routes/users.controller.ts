import { Request, Response } from "express";
import * as UsersService from "../services/users.service";
import * as GroupsService from "../services/groups.service";
import { IUser, UserRole } from "../models/types";

export async function updateUserProfile(
  req: Request,
  res: Response
): Promise<void> {
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

    if (userId !== (req.user as IUser).id) {
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

    let responseUser = updatedUser;
    if (updatedUser.groupId) {
      const group = GroupsService.getGroupById(updatedUser.groupId);
      if (group) {
        responseUser = {
          ...updatedUser,
          groupName: group.name,
        };
      }
    }

    res.status(200).json({
      success: true,
      user: responseUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}

export async function updateUserGroup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const userId = req.params.id;
    const { groupName } = req.body;

    if (userId !== (req.user as IUser).id) {
      res.status(403).json({
        success: false,
        message: "You can only update your own group",
      });
      return;
    }

    const currentUser = UsersService.getUserById(userId);
    if (currentUser?.role === UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Admin users cannot change their group",
      });
      return;
    }
    const groupId = GroupsService.getGroupByName(groupName);

    if (groupName && !groupId) {
      res.status(404).json({
        success: false,
        message: "Group not found. You can only join existing groups.",
      });
      return;
    }

    const updatedUser = await UsersService.updateUserGroup(
      userId,
      groupName || null
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    let responseUser = updatedUser;
    if (updatedUser.groupId) {
      const group = GroupsService.getGroupById(updatedUser.groupId);
      if (group) {
        responseUser = {
          ...updatedUser,
          groupName: group.name,
        };
      }
    }

    res.status(200).json({
      success: true,
      user: responseUser,
    });
  } catch (error) {
    console.error("Error updating user group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update group",
    });
  }
}

export async function getAllGroups(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const groups = GroupsService.getAllGroups();
    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error getting groups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve groups",
    });
  }
}
