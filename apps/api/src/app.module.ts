import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req })
    }),
    PrismaModule,
    AuthModule,
    InventoryModule,
    PurchaseOrdersModule,
    ApprovalsModule,
    DashboardModule,
    VendorsModule
  ]
})
export class AppModule {}
