import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { IGroup } from "../models/types";

const groups: IGroup[] = [];
const groupsFilePath = path.join(__dirname, "..", "..", "data", "groups.json");

export async function loadGroups(): Promise<void> {
  return new Promise((resolve, reject) => {
    let data = "";
    const readStream = createReadStream(groupsFilePath, { encoding: "utf8" });

    readStream.on("data", (chunk) => {
      data += chunk;
    });

    readStream.on("end", () => {
      try {
        const parsedGroups = JSON.parse(data);
        groups.splice(0, groups.length, ...parsedGroups);
        console.log(`Loaded ${groups.length} groups from file`);
        resolve();
      } catch (error) {
        console.error("Error parsing groups data:", error);
        reject(error);
      }
    });

    readStream.on("error", (error) => {
      console.error("Error reading groups file:", error);
      reject(error);
    });
  });
}

export function getAllGroups(): IGroup[] {
  return [...groups];
}

export function getGroupById(id: string): IGroup | undefined {
  return groups.find((group) => group.id === id);
}

export function getGroupByName(name: string): IGroup | undefined {
  return groups.find(
    (group) => group.name?.toLowerCase() === name?.toLowerCase().trim()
  );
}

export function getGroupByAdminId(adminId: string): IGroup | undefined {
  return groups.find((group) => group.adminId === adminId);
}

export async function createGroup(
  name: string,
  adminId: string
): Promise<IGroup> {
  name = name.trim();
  if (getGroupByName(name)) {
    throw new Error("Group name already exists");
  }

  const newGroup: IGroup = {
    id: randomUUID(),
    name,
    adminId,
    createdAt: new Date(),
  };

  groups.push(newGroup);
  await saveGroups();
  return newGroup;
}

export async function updateGroup(
  id: string,
  data: Partial<IGroup>
): Promise<IGroup | null> {
  const index = groups.findIndex((group) => group.id === id);
  if (index === -1) {
    return null;
  }

  // Don't allow updating certain fields
  const { id: _, adminId: __, createdAt: ___, ...updateData } = data;

  if (updateData.name && updateData.name !== groups[index].name) {
    const existingGroup = getGroupByName(updateData.name);
    if (existingGroup) {
      throw new Error("Group name already exists");
    }
  }

  groups[index] = { ...groups[index], ...updateData };
  await saveGroups();
  return groups[index];
}

async function saveGroups(): Promise<void> {
  try {
    const fileContent = JSON.stringify(groups, null, 2);
    const writeStream = createWriteStream(groupsFilePath);

    await new Promise<void>((resolve, reject) => {
      writeStream.write(fileContent, "utf8", (err) => {
        if (err) {
          reject(err);
          return;
        }
        writeStream.end();
      });

      writeStream.on("finish", () => {
        console.log("Groups saved to file", fileContent);
        resolve();
      });

      writeStream.on("error", (error) => {
        console.error("Error writing groups file:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error saving groups:", error);
    throw new Error("Failed to save groups data");
  }
}
