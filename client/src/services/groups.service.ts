import { IGroup, IUser } from "../model/types";
import { API_URL, getConfig } from "./helpers.service";

interface ApiResponse {
  success: boolean;
  message?: string;
  exists?: boolean;
  groups?: IGroup[];
  group?: IGroup;
  user?: IUser;
}

export async function getAllGroups(): Promise<IGroup[]> {
  const response = await fetch(`${API_URL}/users/groups`, {
    credentials: "include",
  });

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch groups");
  }

  return data.groups || [];
}

export async function checkGroupName(name: string): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/groups/check-name?name=${encodeURIComponent(name)}`,
    {
      credentials: "include",
    }
  );

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to check group name");
  }

  return data.exists || false;
}

export async function createNewGroup(
  name: string
): Promise<{ group: IGroup; user: IUser }> {
  const response = await fetch(
    `${API_URL}/groups/create-and-promote`,
    getConfig({ name })
  );

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.message || "Failed to create group");
  }

  if (!data.group || !data.user) {
    throw new Error("Invalid response from server");
  }

  return {
    group: data.group,
    user: data.user,
  };
}
