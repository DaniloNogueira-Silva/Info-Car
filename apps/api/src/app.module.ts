import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ── Environment Variables ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── TypeORM — SQL Server ───────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 1433),
        username: config.get<string>('DB_USERNAME', 'sa'),
        password: config.get<string>('DB_PASSWORD', 'YourStrong!Passw0rd'),
        database: config.get<string>('DB_DATABASE', 'aivacol'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
