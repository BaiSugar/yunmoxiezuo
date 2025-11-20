import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/config/permissions.config';
import { PromptReportService } from '../services/prompt-report.service';
import { CreateReportDto } from '../dto/create-report.dto';
import { ReviewReportDto } from '../dto/review-report.dto';
import { QueryReportsDto } from '../dto/query-reports.dto';
import { QueryMyReportsDto } from '../dto/query-my-reports.dto';

@ApiTags('提示词举报')
@Controller('api/v1/prompts/reports')
@ApiBearerAuth()
export class PromptReportsController {
  constructor(private readonly reportService: PromptReportService) {}

  @Get('my')
  @ApiOperation({ summary: '查询我的举报记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findMyReports(
    @Req() req: any,
    @Query() query: QueryMyReportsDto,
  ) {
    return await this.reportService.findMyReports(
      req.user.id,
      query.page || 1,
      query.pageSize || 20,
    );
  }

  @Get('stats/:promptId')
  @ApiOperation({ summary: '获取提示词的举报统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async getStats(@Param('promptId', ParseIntPipe) promptId: number) {
    return await this.reportService.getReportStats(promptId);
  }

  @Get()
  @ApiOperation({ summary: '查询举报列表（管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async findAll(@Query() queryReportsDto: QueryReportsDto) {
    return await this.reportService.findAll(queryReportsDto);
  }

  @Post(':promptId')
  @ApiOperation({ summary: '举报提示词' })
  @ApiResponse({ status: 201, description: '举报成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.REPORT)
  async create(
    @Param('promptId', ParseIntPipe) promptId: number,
    @Body() createReportDto: CreateReportDto,
    @Req() req: any,
  ) {
    return await this.reportService.create(promptId, req.user.id, createReportDto);
  }

  @Patch(':reportId/review')
  @ApiOperation({ summary: '审核举报（管理员）' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @RequirePermissions(PERMISSIONS.PROMPT.REPORT_REVIEW)
  async review(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() reviewReportDto: ReviewReportDto,
    @Req() req: any,
  ) {
    return await this.reportService.review(reportId, req.user.id, reviewReportDto);
  }

  @Delete(':reportId')
  @ApiOperation({ summary: '删除举报记录（管理员）' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.PROMPT.MANAGE_ALL)
  async remove(@Param('reportId', ParseIntPipe) reportId: number) {
    await this.reportService.remove(reportId);
  }
}

