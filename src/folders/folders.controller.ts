import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { AuthGuard } from '../common/guards/auth.guard';

interface AuthRequest extends Request {
  user?: { sub: string };
}

@Controller('folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  createFolder(@Body() createDto: CreateFolderDto, @Req() req: AuthRequest) {
    // Đảm bảo userId từ token được sử dụng
    const userId = (req.user as { sub: string } | undefined)?.sub;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const folderData = {
      ...createDto,
      userId: new Types.ObjectId(userId), // Lấy userId từ JWT token
    };
    return this.foldersService.createFolder(folderData);
  }

  @Get()
  getAllFolders() {
    return this.foldersService.getAllFolders();
  }

  @Get('user/:userId')
  getFoldersByUserId(@Param('userId') userId: string) {
    return this.foldersService.getFoldersByUserId(userId);
  }

  @Get(':folderId')
  getFolderById(@Param('folderId') folderId: string) {
    return this.foldersService.getFolderById(folderId);
  }

  @Patch(':folderId')
  updateFolder(
    @Param('folderId') folderId: string,
    @Body() updateData: Partial<CreateFolderDto>,
  ) {
    return this.foldersService.updateFolder(folderId, updateData);
  }

  @Delete(':folderId')
  deleteFolder(@Param('folderId') folderId: string) {
    return this.foldersService.deleteFolder(folderId);
  }

  // get children folders
  @Get(':folderId/children')
  getChildrenFolders(@Param('folderId') folderId: string) {
    return this.foldersService.getChildrenFolders(folderId);
  }

  // get children folders with file count
  @Get(':folderId/children-with-count')
  getChildrenFoldersWithFileCount(@Param('folderId') folderId: string) {
    return this.foldersService.getChildrenFoldersWithFileCount(folderId);
  }

  // Get user's root folders (folders without parent)
  @Get('user/:userId/root')
  getUserRootFolders(@Param('userId') userId: string) {
    return this.foldersService.getUserRootFolders(userId);
  }

  // Get user's folders with file count
  @Get('user/:userId/with-count')
  getFoldersWithFileCount(@Param('userId') userId: string) {
    return this.foldersService.getFoldersWithFileCount(userId);
  }

  // Get user's root folders with file count
  @Get('user/:userId/root-with-count')
  getUserRootFoldersWithFileCount(@Param('userId') userId: string) {
    return this.foldersService.getUserRootFoldersWithFileCount(userId);
  }
}
