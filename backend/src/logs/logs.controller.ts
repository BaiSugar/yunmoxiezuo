import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import type { QueryLogsDto } from './logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('日志')
@Controller('api/v1/logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @RequirePermissions('system:log')
  @ApiOperation({ summary: '获取日志列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'level', required: false })
  findAll(@Query() queryDto: QueryLogsDto) {
    return this.logsService.findAll(queryDto);
  }

  @Get('statistics')
  @RequirePermissions('system:log')
  @ApiOperation({ summary: '获取日志统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiQuery({ name: 'days', required: false, description: '统计天数' })
  getStatistics(@Query('days') days?: number) {
    return this.logsService.getStatistics(days ? +days : 7);
  }
}

