import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsISO8601, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class PurchaseOrderLineDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  vendorId!: string;

  @IsString()
  warehouseId!: string;

  @IsString()
  costCenter!: string;

  @IsISO8601()
  deliveryDate!: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
