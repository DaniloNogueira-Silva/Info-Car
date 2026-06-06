import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BrandOrmEntity } from '../../../brands/infrastructure/entities/brand.orm-entity';

@Entity('models')
export class ModelOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column('uuid')
  brand_id: string;

  @ManyToOne(() => BrandOrmEntity, { eager: false })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandOrmEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 100 })
  created_by: string;
}
