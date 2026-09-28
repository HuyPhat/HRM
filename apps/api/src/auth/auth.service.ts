import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid email or password');

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      initials: user.initials,
      department: user.department,
      role: user.role
    };

    return {
      accessToken: this.jwt.sign(payload),
      user: payload
    };
  }
}
