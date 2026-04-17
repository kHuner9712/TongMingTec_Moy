import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTestSupportService } from './auth-test-support.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../usr/entities/user.entity';
import { UserRole } from '../usr/entities/user-role.entity';
import { Role } from '../usr/entities/role.entity';
import { Permission } from '../usr/entities/permission.entity';
import { RolePermission } from '../usr/entities/role-permission.entity';
import { Organization } from '../org/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      UserRole,
      Role,
      Permission,
      RolePermission,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.accessTokenExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthTestSupportService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
