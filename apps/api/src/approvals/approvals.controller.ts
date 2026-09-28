import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ApprovalsService } from './approvals.service';
import { DecideDto } from './dto/decide.dto';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list() {
    return this.approvals.list();
  }

  @Post(':id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideDto, @CurrentUser() user: JwtPayload) {
    return this.approvals.decide(id, user, dto.decision, dto.comment);
  }
}
