import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailTemplateService } from '../services/email-template.service';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { EMAIL_TEMPLATE_PERMISSIONS } from '../../common/config/permissions.config';

@ApiTags('邮件模板')
@ApiBearerAuth()
@Controller('/api/v1/email-templates')
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Get()
  @RequirePermissions(EMAIL_TEMPLATE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取所有邮件模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll() {
    return this.emailTemplateService.findAll();
  }

  @Get(':id')
  @RequirePermissions(EMAIL_TEMPLATE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: '获取单个邮件模板' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.emailTemplateService.findOne(id);
  }

  @Post()
  @RequirePermissions(EMAIL_TEMPLATE_PERMISSIONS.CREATE)
  @ApiOperation({ summary: '创建邮件模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createDto: CreateEmailTemplateDto) {
    return this.emailTemplateService.create(createDto);
  }

  @Put(':id')
  @RequirePermissions(EMAIL_TEMPLATE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: '更新邮件模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(EMAIL_TEMPLATE_PERMISSIONS.DELETE)
  @ApiOperation({ summary: '删除邮件模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.emailTemplateService.remove(id);
    return { message: '删除成功' };
  }
}

