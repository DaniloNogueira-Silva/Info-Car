import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, User } from '@app/shared';
import type { IUserRepository } from '@app/shared';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(user: Partial<User>): Promise<User> {
    return this.userRepository.create(user);
  }
}
