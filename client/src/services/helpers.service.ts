export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:8000" : "");

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

export function isHebrewText(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}
