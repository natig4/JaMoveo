import { IGroup } from "../model/types";
import { API_URL } from "./helpers.service";

interface ApiResponse {
  success: boolean;
  message?: string;
  exists?: boolean;
  groups?: IGroup[];
  group?: IGroup;
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
