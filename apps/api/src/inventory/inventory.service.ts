import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InventoryQuery {
  warehouseId?: string;
  category?: string;
  lowStockOnly?: boolean;
  search?: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: InventoryQuery) {
    const levels = await this.prisma.stockLevel.findMany({
      where: {
        warehouseId: query.warehouseId || undefined,
        item: {
          category: query.category || undefined,
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { code: { contains: query.search, mode: 'insensitive' } }
                ]
              }
            : {})
        }
      },
      include: { item: true, warehouse: true },
      orderBy: { item: { code: 'asc' } }
    });

    const rows = levels.map((level) => {
      const available = level.onHand - level.reserved;
      const status = available <= 0 ? 'Out of Stock' : available < level.item.reorderPoint ? 'Low Stock' : 'In Stock';
      return {
        id: level.id,
        code: level.item.code,
        name: level.item.name,
        category: level.item.category,
        warehouseCode: level.warehouse.code,
        warehouseName: level.warehouse.name,
        onHand: level.onHand,
        reserved: level.reserved,
        available,
        reorderPoint: level.item.reorderPoint,
        status,
        lastMovement: level.lastMovement
      };
    });

    return query.lowStockOnly ? rows.filter((r) => r.status !== 'In Stock') : rows;
  }

  warehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { code: 'asc' } });
  }

  categories() {
    return this.prisma.item.findMany({ distinct: ['category'], select: { category: true } }).then((rows) => rows.map((r) => r.category));
  }
}
