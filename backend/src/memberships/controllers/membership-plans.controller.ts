import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipPlansService } from '../services/membership-plans.service';
import { CreateMembershipPlanDto } from '../dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from '../dto/update-membership-plan.dto';
import { QueryMembershipPlanDto } from '../dto/query-membership-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 会员套餐管理控制器
 */
@ApiTags('会员套餐管理')
@Controller('/api/v1/membership-plans')
export class MembershipPlansController {
  constructor(private readonly plansService: MembershipPlansService) {}

  @Post()
  @ApiOperation({ summary: '创建会员套餐' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:create')
  create(@Body() createDto: CreateMembershipPlanDto) {
    return this.plansService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询套餐列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryMembershipPlanDto) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取套餐详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '套餐不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新套餐' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMembershipPlanDto,
  ) {
    return this.plansService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除套餐' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '上架套餐' })
  @ApiResponse({ status: 200, description: '上架成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:update')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '下架套餐' })
  @ApiResponse({ status: 200, description: '下架成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:update')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.deactivate(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: '切换套餐状态（上架/下架）' })
  @ApiResponse({ status: 200, description: '切换成功' })
  @ApiBearerAuth()
  @RequirePermissions('membership:plan:update')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.toggleStatus(id);
  }
}
