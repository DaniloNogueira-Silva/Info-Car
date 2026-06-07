import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerOrmEntity } from './infrastructure/entities/customer.orm-entity';
import { CustomersService } from './application/customers.service';
import { CustomersController } from './presentation/customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
