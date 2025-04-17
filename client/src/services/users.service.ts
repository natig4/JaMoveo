import { User } from "../model/types";
import { getConfig } from "./auth.service";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:8000" : "");

interface ApiResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export async function updateUserProfile(
  userId: string,
  userData: Partial<User>
): Promise<User> {
  const response = await fetch(
    `${API_URL}/users/${userId}`,
    getConfig(userData, "PATCH")
  );

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  if (!data.user) {
    throw new Error("User data missing in response");
  }

  return data.user;
}
