export const TIMEOUT = 7000;

export const timeoutPromise = new Promise((_, reject) => {
  setTimeout(
    () => reject(new Error("Request timed out after 7 seconds")),
    TIMEOUT
  );
});
