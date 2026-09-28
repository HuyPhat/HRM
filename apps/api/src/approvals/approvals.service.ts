import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

const PO_INCLUDE = {
  vendor: true,
  requester: true,
  warehouse: true,
  lines: true,
  approvals: { orderBy: { sequence: 'asc' as const } }
};

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.purchaseOrder.findMany({
      where: { status: { in: ['PENDING_MANAGER', 'PENDING_FINANCE'] } },
      include: PO_INCLUDE,
      orderBy: { createdAt: 'asc' }
    });
  }

  async decide(purchaseOrderId: string, user: JwtPayload, decision: 'approved' | 'rejected', comment?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: PO_INCLUDE
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const currentStep = po.approvals.find((step) => step.status === 'PENDING');
    if (!currentStep) throw new BadRequestException('This purchase order has no pending approval step');
    if (currentStep.role !== user.role) {
      throw new ForbiddenException(`This step needs ${currentStep.role} sign-off — you are signed in as ${user.role}`);
    }

    await this.prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: decision === 'approved' ? 'APPROVED' : 'REJECTED',
        comment,
        decidedAt: new Date()
      }
    });

    let nextStatus: 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'APPROVED' | 'REJECTED';
    if (decision === 'rejected') {
      nextStatus = 'REJECTED';
    } else {
      const remaining = po.approvals.filter((step) => step.status === 'PENDING' && step.id !== currentStep.id);
      nextStatus = remaining.length > 0 ? (remaining[0].role === 'FINANCE' ? 'PENDING_FINANCE' : 'PENDING_MANAGER') : 'APPROVED';
    }

    return this.prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: nextStatus },
      include: PO_INCLUDE
    });
  }
}
