import { User, UserCredentials } from "../model/types";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:8000" : "");

function getConfig<T>(data: T): RequestInit {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

async function postRequest<TInput, TOutput>(
  endpoint: string,
  data: TInput,
  defaultErrorMessage: string
): Promise<TOutput> {
  try {
    const response = await fetch(`${API_URL}/auth${endpoint}`, getConfig(data));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || defaultErrorMessage);
    }

    return await response.json();
  } catch (error) {
    throw error instanceof Error ? error : new Error(defaultErrorMessage);
  }
}

export function login(credentials: UserCredentials): Promise<User> {
  return postRequest<UserCredentials, User>(
    "/login",
    credentials,
    "Login failed"
  );
}

export function register(
  userData: Omit<User, "id" | "role"> & { password: string }
): Promise<User> {
  return postRequest<typeof userData, User>(
    "/register",
    userData,
    "Registration failed"
  );
}
