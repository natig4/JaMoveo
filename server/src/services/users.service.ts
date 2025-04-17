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
  return users.find((user) => String(user.id) === String(id));
}

export function getUserByUsername(username: string): User | undefined {
  return users.find((user) => user.username === username);
}

export function getUserByGoogleId(googleId: string): User | undefined {
  return users.find((user) => user.googleId === googleId);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email);
}

export async function findOrCreateGoogleUser(
  profile: GoogleUserProfile
): Promise<User> {
  // First, check if user already exists with this Google ID
  let user = getUserByGoogleId(profile.googleId);
  if (user) {
    return user;
  }

  // Check if a user with the same email already exists
  if (profile.email) {
    user = getUserByEmail(profile.email);
    if (user) {
      user.googleId = profile.googleId;
      user.displayName = profile.displayName || user.displayName;
      await saveUsers();
      return user;
    }
  }

  // Create a new user with Google profile info
  return addUser({
    username: profile.username,
    email: profile.email,
    googleId: profile.googleId,
    displayName: profile.displayName,
    role: profile.role || UserRole.USER,
    // No password needed for Google-authenticated users
  });
}

export async function addUser(userData: Omit<User, "id">): Promise<User> {
  if (getUserByUsername(userData.username)) {
    throw new Error("Username already exists");
  }

  if (userData.email && users.some((u) => u.email === userData.email)) {
    throw new Error("Email already exists");
  }

  const newUser: User = {
    ...userData,
    id: randomUUID(),
    role: userData.role || UserRole.USER,
  };

  // Only hash password if one is provided (not for Google auth)
  if (userData.password) {
    newUser.password = await hashPassword(userData.password);
  }

  users.push(newUser);
  await saveUsers();

  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
}

export async function updateUser(
  userId: string,
  userData: Partial<User>
): Promise<Omit<User, "password" | "googleId"> | null> {
  const userIndex = users.findIndex(
    (user) => String(user.id) === String(userId)
  );

  if (userIndex === -1) {
    return null;
  }

  // Only allow updating specific fields
  const allowedUpdates = ["displayName", "instrument", "email"];
  const updatedUser = { ...users[userIndex] };

  for (const field of allowedUpdates) {
    if (field in userData) {
      (updatedUser as any)[field] = (userData as any)[field];
    }
  }

  users[userIndex] = updatedUser;
  await saveUsers();

  const { password, googleId, ...userWithoutSensitiveInfo } = updatedUser;
  return userWithoutSensitiveInfo;
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
