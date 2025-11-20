import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PromptApplicationService } from '../services/prompt-application.service';
import { ApplyPromptDto } from '../dto/apply-prompt.dto';
import { ReviewApplicationDto } from '../dto/review-application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('提示词申请管理')
@ApiBearerAuth()
@Controller('api/v1/prompt-applications')
export class PromptApplicationsController {
  constructor(private readonly applicationService: PromptApplicationService) {}

  @Post('prompts/:promptId/apply')
  @ApiOperation({ summary: '申请使用需要申请权限的提示词' })
  @ApiResponse({ status: 201, description: '申请成功' })
  @ApiResponse({ status: 400, description: '该提示词无需申请即可使用 / 不能申请自己的提示词 / 已有待审核的申请' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  applyForPrompt(
    @Param('promptId', ParseIntPipe) promptId: number,
    @CurrentUser('id') userId: number,
    @Body() applyPromptDto: ApplyPromptDto,
  ) {
    return this.applicationService.applyForPrompt(promptId, userId, applyPromptDto);
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findMyApplications(@CurrentUser('id') userId: number) {
    return this.applicationService.findApplicationsByUser(userId);
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待我审核的申请列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findPendingApplications(@CurrentUser('id') authorId: number) {
    return this.applicationService.findPendingApplications(authorId);
  }

  @Get('prompts/:promptId')
  @ApiOperation({ summary: '获取提示词的申请列表（仅作者）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 403, description: '只有作者可以查看申请列表' })
  @ApiResponse({ status: 404, description: '提示词不存在' })
  findApplicationsByPrompt(
    @Param('promptId', ParseIntPipe) promptId: number,
    @CurrentUser('id') authorId: number,
  ) {
    return this.applicationService.findApplicationsByPrompt(promptId, authorId);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: '审核申请（仅作者）' })
  @ApiResponse({ status: 200, description: '审核成功' })
  @ApiResponse({ status: 400, description: '该申请已被审核' })
  @ApiResponse({ status: 403, description: '只有作者可以审核申请' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  reviewApplication(
    @Param('id', ParseIntPipe) applicationId: number,
    @CurrentUser('id') reviewerId: number,
    @Body() reviewApplicationDto: ReviewApplicationDto,
  ) {
    return this.applicationService.reviewApplication(
      applicationId,
      reviewerId,
      reviewApplicationDto,
    );
  }
}
