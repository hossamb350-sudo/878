export const CURRENT_APP_VERSION = "1.2.0";

/**
 * Compares two semantic version strings (e.g. "1.0.1" and "1.1.0").
 * Returns true if the current version is older/lower than the required version.
 */
export function isVersionOutdated(current: string, required: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const curParts = parse(current);
  const reqParts = parse(required);
  
  for (let i = 0; i < Math.max(curParts.length, reqParts.length); i++) {
    const cur = curParts[i] || 0;
    const req = reqParts[i] || 0;
    if (cur < req) return true;
    if (cur > req) return false;
  }
  return false;
}
