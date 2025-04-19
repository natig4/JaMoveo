import { Request, Response } from "express";
import * as GroupsService from "../services/groups.service";
import * as UsersService from "../services/users.service";
import { IUser, UserRole } from "../models/types";

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

export async function getGroupById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const group = GroupsService.getGroupById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: "Group not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Error getting group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve group",
    });
  }
}

export async function checkGroupName(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        message: "Group name is required",
      });
      return;
    }

    const existingGroup = GroupsService.getGroupByName(name);

    res.status(200).json({
      success: true,
      exists: !!existingGroup,
    });
  } catch (error) {
    console.error("Error checking group name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check group name",
    });
  }
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const user = req.user as IUser;
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "Only admins can create groups",
      });
      return;
    }

    const { name } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        message: "Group name is required",
      });
      return;
    }

    const existingAdminGroup = GroupsService.getGroupByAdminId(user.id);
    if (existingAdminGroup) {
      res.status(400).json({
        success: false,
        message: "Admin already has a group",
      });
      return;
    }

    const newGroup = await GroupsService.createGroup(name, user.id);

    await UsersService.updateUser(user.id, { groupId: newGroup.id });

    res.status(201).json({
      success: true,
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);

    if (
      error instanceof Error &&
      error.message === "Group name already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
}

export async function createGroupAndPromote(
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

    const user = req.user as IUser;
    if (user.role === UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: "User is already an admin",
      });
      return;
    }

    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Valid group name is required (min 3 characters)",
      });
      return;
    }

    const existingGroup = GroupsService.getGroupByName(name);
    if (existingGroup) {
      res.status(409).json({
        success: false,
        message: "Group name already exists",
      });
      return;
    }

    const updatedUser = await UsersService.updateUser(user.id, {
      role: UserRole.ADMIN,
    });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        message: "Failed to update user role",
      });
      return;
    }

    const newGroup = await GroupsService.createGroup(name, user.id);

    const finalUser = await UsersService.updateUser(user.id, {
      groupId: newGroup.id,
    });

    if (!finalUser) {
      res.status(500).json({
        success: false,
        message: "Failed to update user group",
      });
      return;
    }

    const userWithGroupName = {
      ...finalUser,
      groupName: newGroup.name,
    };

    res.status(201).json({
      success: true,
      group: newGroup,
      user: userWithGroupName,
    });
  } catch (error) {
    console.error("Error creating group and promoting user:", error);

    if (
      error instanceof Error &&
      error.message === "Group name already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create group and promote user",
    });
  }
}

export async function getGroupUsers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const group = GroupsService.getGroupById(id);

    if (!group) {
      res.status(404).json({
        success: false,
        message: "Group not found",
      });
      return;
    }

    const users = UsersService.getUsersInGroup(id).map(
      ({ password, googleId, ...user }) => user
    );

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error getting group users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve group users",
    });
  }
}
