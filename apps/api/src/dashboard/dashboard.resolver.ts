import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './dto/dashboard.types';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboard: DashboardService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => DashboardSummary)
  dashboardSummary(@Args('locale', { type: () => String, nullable: true }) locale?: string) {
    return this.dashboard.getSummary(locale ?? 'en-US');
  }
}
