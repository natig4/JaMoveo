import { createReadStream, createWriteStream } from "fs";
import * as path from "path";
import { User, UserRole } from "../models/types";

const users: User[] = [];
const usersFilePath = path.join(__dirname, "..", "..", "data", "users.json");

export async function loadUsers(): Promise<void> {
  return new Promise((resolve, reject) => {
    let data = "";
    const readStream = createReadStream(usersFilePath, { encoding: "utf8" });

    readStream.on("data", (chunk) => {
      data += chunk;
    });

    readStream.on("end", () => {
      try {
        const parsedUsers = JSON.parse(data);
        users.splice(0, users.length, ...parsedUsers);
        console.log(`Loaded ${users.length} users from file`);
        resolve();
      } catch (error) {
        console.error("Error parsing users data:", error);
        reject(error);
      }
    });

    readStream.on("error", (error) => {
      console.error("Error reading users file:", error);
      reject(error);
    });
  });
}

export function getAllUsers(): Omit<User, "password">[] {
  return users.map(({ id, role, username, instrument }) => ({
    id,
    role,
    username,
    instrument,
  }));
}

export function getUserById(id: number): User | undefined {
  return users.find((user) => user.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return users.find((user) => user.username === username);
}

export async function addUser(userData: Omit<User, "id">): Promise<User> {
  if (getUserByUsername(userData.username)) {
    throw new Error("Username already exists");
  }

  const newId =
    users.length > 0
      ? Math.max(
          ...users.map((u) =>
            typeof u.id === "number" ? u.id : parseInt(String(u.id))
          )
        ) + 1
      : 1;

  // TODO:need to salt the password

  const newUser: User = {
    ...userData,
    id: newId,
    role: userData.role || UserRole.USER,
  };

  users.push(newUser);
  await saveUsers();
  return newUser;
}

async function saveUsers(): Promise<void> {
  try {
    const fileContent = JSON.stringify(users, null, 2);
    const writeStream = createWriteStream(usersFilePath);

    await new Promise<void>((resolve, reject) => {
      writeStream.write(fileContent, "utf8", (err) => {
        if (err) {
          reject(err);
          return;
        }
        writeStream.end();
      });

      writeStream.on("finish", () => {
        console.log("Users saved to file");
        resolve();
      });

      writeStream.on("error", (error) => {
        console.error("Error writing users file:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error saving users:", error);
    throw new Error("Failed to save users data");
  }
}

export function validateUserCredentials(
  username: string,
  password: string
): User | undefined {
  const user = getUserByUsername(username);
  if (!user || user.password !== password) {
    return undefined;
  }
  return user;
}
