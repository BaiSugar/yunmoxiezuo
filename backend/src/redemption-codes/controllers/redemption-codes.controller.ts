import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RedemptionCodesService } from '../services/redemption-codes.service';
import { CodeRedemptionService } from '../services/code-redemption.service';
import { CreateRedemptionCodeDto } from '../dto/create-redemption-code.dto';
import { BatchCreateCodesDto } from '../dto/batch-create-codes.dto';
import { RedeemCodeDto } from '../dto/redeem-code.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateRedemptionCodeDto } from '../dto/update-redemption-code.dto';

/**
 * 卡密管理控制器
 */
@ApiTags('卡密管理')
@Controller('/api/v1/redemption-codes')
export class RedemptionCodesController {
  constructor(
    private readonly codesService: RedemptionCodesService,
    private readonly redemptionService: CodeRedemptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:create')
  create(@Body() createDto: CreateRedemptionCodeDto, @CurrentUser('id') userId: number) {
    return this.codesService.create(createDto, userId);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:create')
  batchCreate(@Body() batchDto: BatchCreateCodesDto, @CurrentUser('id') userId: number) {
    return this.codesService.batchCreate(batchDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '查询卡密列表' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:view')
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('type') type?: string,
    @Query('batchId') batchId?: string,
    @Query('isActive') isActive?: string,
    @Query('code') code?: string,
  ) {
    return this.codesService.findAll({
      page,
      limit,
      type,
      batchId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      code,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: '获取卡密统计' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:view')
  getStatistics() {
    return this.codesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询卡密详情' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.codesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRedemptionCodeDto,
  ) {
    return this.codesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.codesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: '切换卡密状态' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:update')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.codesService.toggleStatus(id);
  }

  @Post('redeem')
  @ApiOperation({ summary: '兑换卡密' })
  @ApiBearerAuth()
  async redeem(
    @Body() redeemDto: RedeemCodeDto,
    @CurrentUser('id') userId: number,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return await this.redemptionService.redeem(redeemDto.code, userId, ip, userAgent);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: '查询批次卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:view')
  findByBatch(
    @Param('batchId') batchId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return this.codesService.findByBatch(batchId, page, limit);
  }

  @Get(':id/records')
  @ApiOperation({ summary: '查询卡密使用记录' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:view')
  findRecords(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.codesService.findRecords(id, page, limit);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '停用卡密' })
  @ApiBearerAuth()
  @RequirePermissions('redemption:code:update')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.codesService.deactivate(id);
  }
}
