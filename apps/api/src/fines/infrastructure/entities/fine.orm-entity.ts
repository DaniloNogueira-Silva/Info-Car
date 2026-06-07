import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RentalOrmEntity } from '../../../rentals/infrastructure/entities/rental.orm-entity';

@Entity('fines')
export class FineOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  rental_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ length: 255 })
  description: string;

  @ManyToOne(() => RentalOrmEntity)
  @JoinColumn({ name: 'rental_id' })
  rental: RentalOrmEntity;

  @CreateDateColumn()
  created_at: Date;
}
