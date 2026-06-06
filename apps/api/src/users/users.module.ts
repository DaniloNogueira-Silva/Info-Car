import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '@app/shared';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserTypeOrmRepository } from './infrastructure/repositories/user-typeorm.repository';
import { UsersService } from './application/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserTypeOrmRepository,
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
