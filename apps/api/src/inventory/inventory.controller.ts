import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(
    @Query('warehouseId') warehouseId?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('search') search?: string
  ) {
    return this.inventory.list({ warehouseId, category, lowStockOnly: lowStockOnly === 'true', search });
  }

  @Get('warehouses')
  warehouses() {
    return this.inventory.warehouses();
  }

  @Get('categories')
  categories() {
    return this.inventory.categories();
  }
}
