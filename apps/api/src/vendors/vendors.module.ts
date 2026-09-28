import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VendorsController } from './vendors.controller';

@Module({
  imports: [AuthModule],
  controllers: [VendorsController]
})
export class VendorsModule {}
