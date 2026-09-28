import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class KpiTile {
  @Field() label!: string;
  @Field() value!: string;
  @Field() delta!: string;
  @Field() tone!: string;
}

@ObjectType()
export class AgingBucket {
  @Field() label!: string;
  @Field(() => Float) amount!: number;
  @Field(() => Float) pct!: number;
}

@ObjectType()
export class TransactionRow {
  @Field() date!: string;
  @Field() type!: string;
  @Field() reference!: string;
  @Field() party!: string;
  @Field(() => Float) amount!: number;
  @Field() status!: string;
}

@ObjectType()
export class ApprovalPreview {
  @Field() id!: string;
  @Field() number!: string;
  @Field() vendor!: string;
  @Field(() => Float) amount!: number;
  @Field() requester!: string;
  @Field() waiting!: string;
}

@ObjectType()
export class DashboardSummary {
  @Field(() => [KpiTile]) kpis!: KpiTile[];
  @Field(() => [AgingBucket]) aging!: AgingBucket[];
  @Field(() => [TransactionRow]) transactions!: TransactionRow[];
  @Field(() => [ApprovalPreview]) pendingApprovals!: ApprovalPreview[];
}
