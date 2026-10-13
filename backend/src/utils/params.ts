/**
 * Safely extract a route param as a string.
 * Express 5 types req.params values as string | string[].
 */
export function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
