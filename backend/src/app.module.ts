import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './modules/auth/auth.module';
import { OrgModule } from './modules/org/org.module';
import { UsrModule } from './modules/usr/usr.module';
import { CmModule } from './modules/cm/cm.module';
import { LmModule } from './modules/lm/lm.module';
import { OmModule } from './modules/om/om.module';
import { CnvModule } from './modules/cnv/cnv.module';
import { TkModule } from './modules/tk/tk.module';
import { TskModule } from './modules/tsk/tsk.module';
import { NtfModule } from './modules/ntf/ntf.module';
import { ChnModule } from './modules/chn/chn.module';
import { AiModule } from './modules/ai/ai.module';
import { AudModule } from './modules/aud/aud.module';
import { SysModule } from './modules/sys/sys.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';

import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize') || false,
        logging: configService.get('database.logging') || false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
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
    AuthModule,
    OrgModule,
    UsrModule,
    CmModule,
    LmModule,
    OmModule,
    CnvModule,
    TkModule,
    TskModule,
    NtfModule,
    ChnModule,
    AiModule,
    AudModule,
    SysModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
