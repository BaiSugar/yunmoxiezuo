import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('作品管理 - 文件上传')
@Controller('api/v1/novels/upload')
@ApiBearerAuth()
export class UploadController {
  /**
   * 上传封面图片
   */
  @Post('cover')
  @ApiOperation({ summary: '上传作品封面' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '封面图片文件（支持jpg, jpeg, png, webp）',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads', 'covers');
          // 确保上传目录存在
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // 生成唯一文件名：时间戳-随机数.扩展名
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `cover-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 只允许图片格式
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('只支持 jpg, jpeg, png, webp 格式的图片'),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 限制 5MB
      },
    }),
  )
  async uploadCover(
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    // 返回文件访问URL
    const fileUrl = `/uploads/covers/${file.filename}`;

    return {
      success: true,
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      timestamp: Date.now(),
    };
  }
}
