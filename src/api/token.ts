type TokenProvider = () => Promise<string | null> | string | null;

let tokenProvider: TokenProvider | null = null;

export function setAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenProvider) {
    return null;
  }

  return tokenProvider();
}
