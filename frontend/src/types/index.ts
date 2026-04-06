export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  mobile: string | null;
  status: string;
  orgId: string;
  departmentId: string | null;
  roles: string[];
  permissions: string[];
  dataScope: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
