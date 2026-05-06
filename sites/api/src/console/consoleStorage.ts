const TOKEN_KEY = "moy_api_admin_token";
const TEST_KEY = "moy_api_test_key";

export function getAdminToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getTestKey(): string {
  return localStorage.getItem(TEST_KEY) || "";
}

export function setTestKey(key: string): void {
  localStorage.setItem(TEST_KEY, key);
}

export function clearTestKey(): void {
  localStorage.removeItem(TEST_KEY);
}
