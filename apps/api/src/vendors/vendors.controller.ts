import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  }
}
