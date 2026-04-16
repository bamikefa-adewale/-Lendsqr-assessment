export interface ActiveUserData {
  sub: string;
  email: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}
