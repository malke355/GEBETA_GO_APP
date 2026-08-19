let currentToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentToken = token;
}

export async function getAuthToken(): Promise<string | null> {
  return currentToken;
}
