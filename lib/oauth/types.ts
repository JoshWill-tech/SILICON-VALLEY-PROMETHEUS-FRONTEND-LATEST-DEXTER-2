export type OAuthProvider = 'youtube' | 'tiktok' | 'instagram' | 'x' | 'google_drive' | 'dropbox' | 'facebook' | 'linkedin';

export interface OAuthState {
  userId: string;
  provider: OAuthProvider;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: number;
}

export interface ProviderConfig {
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  scopeSeparator: ' ' | ',';
  pkce: boolean;
}
