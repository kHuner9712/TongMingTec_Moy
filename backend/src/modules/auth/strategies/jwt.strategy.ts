import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../usr/entities/user.entity';
import { UserRole } from '../../usr/entities/user-role.entity';
import { RolePermission } from '../../usr/entities/role-permission.entity';

interface JwtPayload {
  sub: string;
  orgId: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('AUTH_UNAUTHORIZED');
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roles = userRoles.map((ur) => ur.role.code);
    let dataScope = 'self';

    if (userRoles.length > 0) {
      dataScope = userRoles[0].role.dataScope;
    }

    let permissions: string[] = [];
    if (roleIds.length > 0) {
      const rolePermissions = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .innerJoinAndSelect('rp.permission', 'permission')
        .where('rp.roleId IN (:...roleIds)', { roleIds })
        .getMany();

      permissions = [...new Set(rolePermissions.map((rp) => rp.permission.permId))];
    }

    return {
      id: user.id,
      orgId: user.orgId,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      departmentId: user.departmentId,
      roles,
      permissions,
      dataScope,
    };
  }
}
