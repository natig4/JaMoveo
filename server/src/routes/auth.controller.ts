import { Request, Response, NextFunction } from "express";
import passport from "passport";
import * as UsersService from "../services/users.service";
import { User, UserRole } from "../models/types";

// Default session options
const DEFAULT_SESSION_OPTIONS = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// Extended session options for "remember me"
const EXTENDED_SESSION_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

async function registerUser(userData: Omit<User, "id">, role: UserRole) {
  if (!userData.username || !userData.password) {
    throw new Error("Username and password are required");
  }

  const existingUser = UsersService.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const newUser = await UsersService.addUser({
    ...userData,
    role,
  });

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

function handleRegister(role: UserRole) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;
      const user = await registerUser(userData, role);

      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          res.status(500).json({
            success: false,
            message: "Registration successful but failed to log in",
          });
          return;
        }

        if (req.session) {
          req.session.cookie.maxAge = DEFAULT_SESSION_OPTIONS.maxAge;
        }

        res.status(201).json({
          success: true,
          user,
        });
      });
    } catch (error) {
      console.error(`Error registering ${role}:`, error);

      if (error instanceof Error) {
        const statusMap: Record<string, number> = {
          "Username already exists": 409,
          "Username and password are required": 400,
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

        if (req.session) {
          if (rememberMe) {
            req.session.cookie.maxAge = EXTENDED_SESSION_OPTIONS.maxAge;
          } else {
            req.session.cookie.maxAge = null;
          }
        }

        return res.status(200).json({
          success: true,
          user,
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
      req.session.destroy((sessionErr: Error) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
        }

        res.clearCookie("connect.sid");

        res.status(200).json({
          success: true,
          message: "Successfully logged out",
        });
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Successfully logged out",
      });
    }
  });
}

export function getCurrentUser(req: Request, res: Response): void {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
}

export function googleAuthCallback(req: Request, res: Response): void {
  if (req.session && req.user) {
    req.session.cookie.maxAge = DEFAULT_SESSION_OPTIONS.maxAge;
  }

  res.redirect(req.user ? "/" : "/signin");
}
