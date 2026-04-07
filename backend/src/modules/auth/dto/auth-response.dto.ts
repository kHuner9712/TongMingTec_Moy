import { Expose, Type } from 'class-transformer';

export class UserSessionDto {
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

export class TokenPairDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  expiresIn: number;

  @Expose()
  tokenType: string;
}

export class AuthSessionResponseDto {
  @Expose()
  @Type(() => UserSessionDto)
  user: UserSessionDto;

  @Expose()
  @Type(() => TokenPairDto)
  tokens: TokenPairDto;
}

export class MeResponseDto {
  @Expose()
  @Type(() => UserSessionDto)
  user: UserSessionDto;
}
