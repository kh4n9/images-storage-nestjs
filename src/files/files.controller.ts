import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest, Response } from 'express';
import { FilesService } from './files.service';
import { Files } from './files.schema';
import { UploadFileDto } from './dto/upload-file.dto';

interface AuthRequest extends ExpressRequest {
  user?: { sub: string };
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Request() req: AuthRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user?.sub; // From JWT payload
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.filesService.uploadFile(file, uploadDto, userId);
  }

  @Get(':id')
  async getFileById(@Param('id') id: string) {
    return this.filesService.getFileById(id);
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename, mimeType } =
      await this.filesService.downloadFile(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('user/:userId')
  async getFilesByUser(@Param('userId') userId: string) {
    return this.filesService.getFilesByUser(userId);
  }

  @Get('folder/:folderId')
  async getFilesByFolder(@Param('folderId') folderId: string) {
    return this.filesService.getFilesByFolder(folderId);
  }

  @Patch(':id')
  async updateFile(
    @Param('id') id: string,
    @Body() updateData: Partial<Files>,
  ) {
    return this.filesService.updateFile(id, updateData);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const success = await this.filesService.deleteFile(id, userId);
    return { success, message: 'File deleted successfully' };
  }

  // Admin endpoint to cleanup orphaned files
  @Post('admin/cleanup-orphaned')
  async cleanupOrphanedFiles(@Request() req: AuthRequest) {
    // Add admin role check if needed
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const result = await this.filesService.cleanupOrphanedFiles();
    return {
      success: true,
      message: 'Cleanup completed',
      ...result,
    };
  }
}
