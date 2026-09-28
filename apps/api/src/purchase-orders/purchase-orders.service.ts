import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

const PO_INCLUDE = {
  vendor: true,
  requester: true,
  warehouse: true,
  lines: true,
  approvals: { orderBy: { sequence: 'asc' as const } }
};

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.purchaseOrder.findMany({ include: PO_INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: PO_INCLUDE });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, user: JwtPayload) {
    const count = await this.prisma.purchaseOrder.count();
    const number = `PO-${10500 + count}`;

    return this.prisma.purchaseOrder.create({
      data: {
        number,
        vendorId: dto.vendorId,
        warehouseId: dto.warehouseId,
        requesterId: user.sub,
        costCenter: dto.costCenter,
        deliveryDate: new Date(dto.deliveryDate),
        priority: dto.priority ?? 'Standard',
        notes: dto.notes,
        status: 'PENDING_MANAGER',
        lines: {
          create: dto.lines.map((l) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice }))
        },
        approvals: {
          create: [
            { role: 'MANAGER', approverName: 'R. Osei', sequence: 1, status: 'PENDING' },
            { role: 'FINANCE', approverName: 'Jordan Lee', sequence: 2, status: 'PENDING' }
          ]
        }
      },
      include: PO_INCLUDE
    });
  }
}
