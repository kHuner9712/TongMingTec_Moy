import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../usr/entities/user.entity';
import { UserRole } from '../usr/entities/user-role.entity';
import { RolePermission } from '../usr/entities/role-permission.entity';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import {
  AuthSessionResponseDto,
  TokenPairDto,
  UserSessionDto,
  MeResponseDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSessionResponseDto> {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return this.buildSessionResponse(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthSessionResponseDto> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('AUTH_UNAUTHORIZED');
      }

      return this.buildSessionResponse(user);
    } catch {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }
  }

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    const sessionUser = await this.buildUserSession(user);

    return {
      user: sessionUser,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('PARAM_INVALID');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });
  }

  private async buildSessionResponse(user: User): Promise<AuthSessionResponseDto> {
    const sessionUser = await this.buildUserSession(user);
    const tokens = await this.generateTokens(user);

    return {
      user: sessionUser,
      tokens,
    };
  }

  private async buildUserSession(user: User): Promise<UserSessionDto> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = userRoles.map((ur) => ur.role.code);

    let permissions: string[] = [];
    let dataScope = 'self';

    if (roleIds.length > 0) {
      const rolePermissions = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoinAndSelect('rp.permission', 'permission')
        .where('rp.roleId IN (:...roleIds)', { roleIds })
        .getMany();

      permissions = [...new Set(rolePermissions.map((rp) => rp.permission.permId))];

      const primaryRole = userRoles.find((ur) => ur.role.dataScope);
      if (primaryRole) {
        dataScope = primaryRole.role.dataScope;
      }
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      orgId: user.orgId,
      departmentId: user.departmentId,
      roles,
      permissions,
      dataScope,
    };
  }

  private async generateTokens(user: User): Promise<TokenPairDto> {
    const payload = {
      sub: user.id,
      orgId: user.orgId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshTokenExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }
}
