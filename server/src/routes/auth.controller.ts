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
    role: role,
    instrument: userData.instrument,
  });

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const userData = req.body as User;
    const user = await registerUser(userData, UserRole.USER);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error registering user:", error);

    if (error instanceof Error) {
      if (error.message === "Username already exists") {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      } else if (error.message === "Username and password are required") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
}

export async function registerAdmin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userData = req.body as User;
    const user = await registerUser(userData, UserRole.ADMIN);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error registering admin:", error);

    if (error instanceof Error) {
      if (error.message === "Username already exists") {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      } else if (error.message === "Username and password are required") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to register admin",
    });
  }
}

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

    // Validate user credentials
    const user = UsersService.validateUserCredentials(username, password);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
      return;
    }

    // Return user without password
    const { password: _password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
}
