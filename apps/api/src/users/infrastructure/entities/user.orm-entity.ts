import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  nickname: string;

  @Column({ length: 150 })
  name: string;

  @Index()
  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 255 })
  password?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ length: 100, nullable: true })
  created_by: string;
}
