import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @Get()
  list() {
    return this.purchaseOrders.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.purchaseOrders.get(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: JwtPayload) {
    return this.purchaseOrders.create(dto, user);
  }
}
