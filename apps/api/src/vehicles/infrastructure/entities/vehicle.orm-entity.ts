import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ModelOrmEntity } from '../../../models/infrastructure/entities/model.orm-entity';

@Entity('vehicles')
export class VehicleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 10, unique: true })
  license_plate: string;

  @Index()
  @Column({ length: 17, unique: true })
  chassis: string;

  @Index()
  @Column({ length: 11, unique: true })
  renavam: string;

  @Column()
  year: number;

  @Column('uuid')
  model_id: string;

  @ManyToOne(() => ModelOrmEntity, { eager: false })
  @JoinColumn({ name: 'model_id' })
  model: ModelOrmEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 100 })
  created_by: string;
}
