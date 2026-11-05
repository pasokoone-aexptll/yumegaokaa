export const readSpacingMs = 5100;
export const refreshIntervalMs = 11000;
export function showReadFailure(loaded: boolean, more: boolean, failures: number) {
  return !loaded || more || failures >= 2;
}
