import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './dto/dashboard.types';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboard: DashboardService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => DashboardSummary)
  dashboardSummary() {
    return this.dashboard.getSummary();
  }
}
