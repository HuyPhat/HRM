import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

@Module({
  imports: [AuthModule],
  providers: [DashboardService, DashboardResolver]
})
export class DashboardModule {}
