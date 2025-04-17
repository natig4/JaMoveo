import { createReadStream, createWriteStream } from "fs";
import * as path from "path";
import { User, UserRole, GoogleUserProfile } from "../models/types";
import { hashPassword } from "../utils/auth";
import { randomUUID } from "crypto";

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

export function getAllUsers(): Omit<User, "password" | "googleId">[] {
  return users.map(
    ({ id, username, email, role, displayName, instrument }) => ({
      id,
      username,
      email,
      role,
      displayName,
      instrument,
    })
  );
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  return users.find((user) => user.username === username);
}

export function getUserByGoogleId(googleId: string): User | undefined {
  return users.find((user) => user.googleId === googleId);
}

export async function findOrCreateGoogleUser(
  profile: GoogleUserProfile
): Promise<User> {
  let user = getUserByGoogleId(profile.googleId);

  if (user) {
    return user;
  }

  if (profile.email) {
    user = users.find((u) => u.email === profile.email);

    if (user) {
      user.googleId = profile.googleId;
      await saveUsers();
      return user;
    }
  }

  return addUser({
    username: profile.username,
    email: profile.email,
    googleId: profile.googleId,
    displayName: profile.displayName,
    role: profile.role,
  });
}

export async function addUser(userData: Omit<User, "id">): Promise<User> {
  if (getUserByUsername(userData.username)) {
    throw new Error("Username already exists");
  }

  if (userData.email && users.some((u) => u.email === userData.email)) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(userData.password as string);

  const newUser: User = {
    ...userData,
    id: randomUUID(),
    role: userData.role || UserRole.USER,
    password: hashedPassword,
  };

  users.push(newUser);
  await saveUsers();

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
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
