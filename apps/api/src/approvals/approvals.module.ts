import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';

@Module({
  imports: [AuthModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService]
})
export class ApprovalsModule {}
