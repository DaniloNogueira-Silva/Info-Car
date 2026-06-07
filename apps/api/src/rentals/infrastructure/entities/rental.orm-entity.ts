import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerOrmEntity } from './customer.orm-entity';
import { VehicleOrmEntity } from '../../../vehicles/infrastructure/entities/vehicle.orm-entity';

@Entity('rentals')
export class RentalOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  vehicle_id: string;

  @Column('uuid')
  customer_id: string;

  @Column({ type: 'datetime2' })
  start_date: Date;

  @Column({ type: 'datetime2', nullable: true })
  end_date: Date;

  @Column({ length: 50, default: 'ACTIVE' })
  status: string; // ACTIVE, FINISHED, CANCELLED

  @ManyToOne(() => VehicleOrmEntity, { eager: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleOrmEntity;

  @ManyToOne(() => CustomerOrmEntity, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerOrmEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
