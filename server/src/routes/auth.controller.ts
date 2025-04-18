import { Request, Response, NextFunction } from "express";
import passport from "passport";
import * as UsersService from "../services/users.service";
import * as GroupsService from "../services/groups.service";
import { IUser, UserRole } from "../models/types";

// Default session options - 24 hours
const DEFAULT_SESSION_OPTIONS = {
  maxAge: 24 * 60 * 60 * 1000,
};

// Extended session options for "remember me" - 30 days
const EXTENDED_SESSION_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

async function registerUser(
  userData: Omit<IUser, "id">,
  role: UserRole,
  groupName?: string
) {
  if (!userData.username || !userData.password) {
    throw new Error("Username and password are required");
  }

  const existingUser = UsersService.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  if (role === UserRole.ADMIN) {
    if (!groupName || groupName.trim().length < 3) {
      throw new Error("Group name is required for admin (min. 3 characters)");
    }

    const existingGroup = GroupsService.getGroupByName(groupName);
    if (existingGroup) {
      throw new Error("Group name already exists");
    }
  }

  const newUser = await UsersService.addUser({
    ...userData,
    role,
  });

  if (role === UserRole.ADMIN && groupName) {
    try {
      const newGroup = await GroupsService.createGroup(groupName, newUser.id);

      await UsersService.updateUser(newUser.id, { groupId: newGroup.id });
      newUser.groupId = newGroup.id;
    } catch (error) {
      console.error("Error creating group during registration:", error);
    }
  } else if (role === UserRole.USER && groupName) {
    const group = GroupsService.getGroupByName(groupName);
    if (group) {
      await UsersService.updateUser(newUser.id, { groupId: group.id });
      newUser.groupId = group.id;
    }
    // If group doesn't exist, don't throw an error - user will need to select a group later
  }

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

function handleRegister(role: UserRole) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;
      const { groupName, ...userDataWithoutGroup } = userData;

      const user = await registerUser(userDataWithoutGroup, role, groupName);

      const responseUser = getUserWithGroupName(user);

      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          res.status(500).json({
            success: false,
            message: "Registration successful but failed to log in",
          });
          return;
        }

        if (req.session && req.session.cookie) {
          req.session.cookie.maxAge = DEFAULT_SESSION_OPTIONS.maxAge;
        }

        res.status(201).json({
          success: true,
          user: responseUser,
        });
      });
    } catch (error) {
      console.error(`Error registering ${role}:`, error);

      if (error instanceof Error) {
        const statusMap: Record<string, number> = {
          "Username already exists": 409,
          "Username and password are required": 400,
          "Group name already exists": 409,
          "Group name is required for admin (min. 3 characters)": 400,
          "This Email address is already registered with another user": 400,
        };

        const status = statusMap[error.message];
        if (status) {
          res.status(status).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: `Failed to register ${role}`,
      });
    }
  };
}

export const register = handleRegister(UserRole.USER);
export const registerAdmin = handleRegister(UserRole.ADMIN);

export function login(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    "local",
    (err: Error, user: Express.User, info: { message: string }) => {
      if (err) {
        console.error("Error during login:", err);
        return res.status(500).json({
          success: false,
          message: "An error occurred during login",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Invalid username or password",
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Error during login:", loginErr);
          return res.status(500).json({
            success: false,
            message: "An error occurred during login",
          });
        }

        const rememberMe = req.body.rememberMe === true;

        if (req.session && req.session.cookie) {
          req.session.cookie.maxAge = rememberMe
            ? EXTENDED_SESSION_OPTIONS.maxAge
            : DEFAULT_SESSION_OPTIONS.maxAge;
        } else {
          console.warn(
            "Session or session.cookie is undefined, couldn't set maxAge"
          );
        }

        return res.status(200).json({
          success: true,
          user: getUserWithGroupName(user as IUser),
        });
      });
    }
  )(req, res, next);
}

export function logout(req: Request, res: Response): void {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({
        success: false,
        message: "An error occurred during logout",
      });
    }

    if (req.session) {
      for (const key in req.session) {
        if (key !== "cookie") {
          delete req.session[key];
        }
      }

      if (req.session.cookie) {
        req.session.cookie.maxAge = 0;
      }
    }

    res.clearCookie("session");

    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  });
}

export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return;
  }

  try {
    const userId = (req.user as IUser).id;
    const user = await UsersService.getUserWithGroupDetails(userId);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user details",
    });
  }
}

export function googleAuthCallback(req: Request, res: Response): void {
  if (req.session && req.user && req.session.cookie) {
    req.session.cookie.maxAge = DEFAULT_SESSION_OPTIONS.maxAge;
  }

  res.redirect(req.user ? "/" : "/signin");
}

function getUserWithGroupName(user: IUser) {
  if (user.groupId) {
    const group = GroupsService.getGroupById(user.groupId);

    if (group) {
      return {
        ...user,
        groupName: group.name,
      };
    }
  }
  return user;
}
