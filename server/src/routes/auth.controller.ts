import { Request, Response } from "express";
import * as UsersService from "../services/users.service";
import { User, UserRole } from "../models/types";

async function registerUser(userData: User, role: UserRole) {
  if (!userData.username || !userData.password) {
    throw new Error("Username and password are required");
  }

  const existingUser = UsersService.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const newUser = await UsersService.addUser({
    username: userData.username,
    password: userData.password,
    role,
    instrument: userData.instrument,
  });

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

function handleRegister(role: UserRole) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body as User;
      const user = await registerUser(userData, role);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error registering user:", error);

      if (error instanceof Error) {
        const statusMap: Record<string, number> = {
          "Username already exists": 409,
          "Username and password are required": 400,
        };

        const status = statusMap[error.message];
        if (status) {
          res.status(status).json({ success: false, message: error.message });
          return;
        }
      }

      res
        .status(500)
        .json({ success: false, message: "Failed to register user" });
    }
  };
}

export const register = handleRegister(UserRole.USER);
export const registerAdmin = handleRegister(UserRole.ADMIN);

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as User;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
      return;
    }

    const user = UsersService.validateUserCredentials(username, password);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
}
