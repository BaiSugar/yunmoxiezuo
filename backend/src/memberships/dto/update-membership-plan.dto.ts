import { PartialType } from '@nestjs/swagger';
import { CreateMembershipPlanDto } from './create-membership-plan.dto';

/**
 * 更新会员套餐 DTO
 */
export class UpdateMembershipPlanDto extends PartialType(CreateMembershipPlanDto) {}
