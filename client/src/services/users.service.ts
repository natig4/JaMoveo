import { IUser } from "../model/types";
import { API_URL, getConfig } from "./helpers.service";

interface ApiResponse {
  success: boolean;
  user?: IUser;
  message?: string;
}

export async function updateUserProfile(
  userId: string,
  userData: Partial<IUser>
): Promise<IUser> {
  const response = await fetch(
    `${API_URL}/users/${userId}`,
    getConfig(userData, "PATCH")
  );

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  if (!data.user) {
    throw new Error("IUser data missing in response");
  }

  return data.user;
}

export async function updateUserGroup(
  userId: string,
  groupName: string | null
): Promise<IUser> {
  const response = await fetch(
    `${API_URL}/users/${userId}/group`,
    getConfig({ groupName }, "PATCH")
  );

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to update group");
  }

  if (!data.user) {
    throw new Error("IUser data missing in response");
  }

  return data.user;
}
