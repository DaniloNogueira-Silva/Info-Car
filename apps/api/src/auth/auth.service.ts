import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const defaultPassword = this.config.get<string>(
      'AUTH_DEFAULT_PASSWORD',
      'Admin@123',
    );

    if (dto.password !== defaultPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: dto.email, email: dto.email };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
