export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "https://localhost:8000" : "");

export function getConfig<T>(data: T, method: string = "POST"): RequestInit {
  return {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for cookies
    body: JSON.stringify(data),
  };
}
