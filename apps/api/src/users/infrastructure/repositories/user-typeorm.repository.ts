import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, IUserRepository } from '@app/shared';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class UserTypeOrmRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findAll(page: number = 1, limit: number = 10, filter?: string): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = filter ? { name: Like(`%${filter}%`) } : {};

    const [entities, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
    });
    
    return {
      data: entities.map((e) => new User(e)),
      total,
    };
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? new User(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? new User(entity) : null;
  }

  async create(user: Partial<User>): Promise<User> {
    const entity = this.repo.create(user);
    const saved = await this.repo.save(entity);
    return new User(saved);
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    await this.repo.update(id, user);
    return this.findById(id) as Promise<User>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
