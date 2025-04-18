import { IUser } from "../model/types";
import { API_URL, getConfig } from "./helpers.service";

interface AuthResponse {
  success: boolean;
  user?: IUser;
  message?: string;
}

export async function register(
  username: string,
  password: string,
  email?: string,
  instrument?: string,
  groupName?: string
): Promise<IUser> {
  const response = await fetch(
    `${API_URL}/auth/register`,
    getConfig({ username, password, email, instrument, groupName })
  );

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  if (!data.user) {
    throw new Error("User data missing in response");
  }

  return data.user;
}

export async function registerAdmin(
  username: string,
  password: string,
  email?: string,
  instrument?: string,
  groupName?: string
): Promise<IUser> {
  const response = await fetch(
    `${API_URL}/auth/register-admin`,
    getConfig({ username, password, email, instrument, groupName })
  );

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.message || "Admin registration failed");
  }

  if (!data.user) {
    throw new Error("User data missing in response");
  }

  return data.user;
}

export async function login(
  username: string,
  password: string,
  rememberMe: boolean = false
): Promise<IUser> {
  const response = await fetch(
    `${API_URL}/auth/login`,
    getConfig({ username, password, rememberMe })
  );

  const data = (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (!data.user) {
    throw new Error("IUser data missing in response");
  }

  return data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Logout failed");
  }
}

export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const response = await fetch(`${API_URL}/auth/current-user`, {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, but not an error
        return null;
      }
      throw new Error("Failed to fetch current user");
    }

    const data = (await response.json()) as AuthResponse;
    return data.user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export function getGoogleAuthUrl(): string {
  return `${API_URL}/auth/google`;
}
