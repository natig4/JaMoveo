export const TIMEOUT = 7000;

export function createTimeoutPromise(ms = TIMEOUT): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Request timed out after ${ms / 1000} seconds`)),
      ms
    );
  });
}
