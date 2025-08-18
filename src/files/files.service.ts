import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Files, FilesDocument } from './files.schema';
import { DiscordStorageService } from '../common/services/discord-storage.service';
import { UploadFileDto } from './dto/upload-file.dto';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(Files.name) private filesModel: Model<FilesDocument>,
    private discordStorageService: DiscordStorageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    userId: string,
  ): Promise<Files> {
    if (!this.discordStorageService.isAvailable()) {
      throw new BadRequestException('Discord storage is not available');
    }

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = uploadDto.name || `${uuidv4()}${fileExtension}`;

    try {
      // Upload to Discord
      const discordResult = await this.discordStorageService.uploadFile(
        file.buffer,
        filename,
        file.originalname,
      );

      // Save file info to database
      const fileData: Partial<Files> = {
        name: filename,
        originalName: file.originalname,
        url: discordResult.url,
        userId: new Types.ObjectId(userId),
        folder: uploadDto.folderId
          ? new Types.ObjectId(uploadDto.folderId)
          : null,
        size: file.size,
        type: fileExtension.toLowerCase(),
        mimeType: file.mimetype,
        guildId: discordResult.guildId,
        channelId: discordResult.channelId,
        messageId: discordResult.messageId,
        storageProvider: 'discord',
        isDeleted: false,
      };

      const newFile = new this.filesModel(fileData);
      const savedFile = await newFile.save();

      // Update folder if specified
      if (uploadDto.folderId) {
        // Note: You might want to update the folder's files array here
        // depending on your folder service implementation
      }

      return savedFile;
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async getFileById(fileId: string): Promise<Files | null> {
    const file = await this.filesModel.findById(fileId).exec();
    if (!file || file.isDeleted) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async getFilesByUser(userId: string): Promise<Files[]> {
    return this.filesModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getFilesByFolder(folderId: string): Promise<Files[]> {
    return this.filesModel
      .find({
        folder: new Types.ObjectId(folderId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countFilesInFolder(folderId: string): Promise<number> {
    return this.filesModel
      .countDocuments({
        folder: new Types.ObjectId(folderId),
        isDeleted: false,
      })
      .exec();
  }

  async updateFile(
    fileId: string,
    updateData: Partial<Files>,
  ): Promise<Files | null> {
    const updatedFile = await this.filesModel
      .findByIdAndUpdate(fileId, updateData, { new: true })
      .exec();

    if (!updatedFile) {
      throw new NotFoundException('File not found');
    }

    return updatedFile;
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await this.filesModel.findById(fileId).exec();

    if (!file || file.userId.toString() !== userId) {
      throw new NotFoundException('File not found or unauthorized');
    }

    try {
      // Try to delete from Discord first
      let discordDeleteSuccess = true;
      if (file.messageId && file.channelId) {
        try {
          discordDeleteSuccess = await this.discordStorageService.deleteFile(
            file.channelId,
            file.messageId,
          );
          if (!discordDeleteSuccess) {
            console.warn(
              `Failed to delete Discord message ${file.messageId}, but continuing with database deletion`,
            );
          }
        } catch (error) {
          console.error(
            `Discord deletion failed for message ${file.messageId}:`,
            error,
          );
          // Continue with database deletion even if Discord fails
        }
      }

      // Always delete from database regardless of Discord result
      await this.filesModel.findByIdAndUpdate(fileId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletionReason: discordDeleteSuccess
          ? 'User deletion'
          : 'User deletion (Discord already removed)',
      });

      return true;
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  async downloadFile(
    fileId: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const file = await this.getFileById(fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      const buffer = await this.discordStorageService.downloadFile(file.url);

      return {
        buffer,
        filename: file.originalName,
        mimeType: file.mimeType,
      };
    } catch (error) {
      throw new BadRequestException(`File download failed: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
  }

  async refreshDiscordUrls(): Promise<number> {
    const files = await this.filesModel
      .find({
        isDeleted: false,
        messageId: { $exists: true, $ne: null },
        channelId: { $exists: true, $ne: null },
      })
      .exec();

    let updated = 0;

    for (const file of files) {
      try {
        const newUrl = await this.discordStorageService.refreshAttachmentUrl(
          file.channelId,
          file.messageId,
        );
        if (newUrl && newUrl !== file.url) {
          await this.filesModel.updateOne({ _id: file._id }, { url: newUrl });
          updated++;
        }
      } catch (error) {
        console.error(`Failed to refresh URL for file ${file._id}:`, error);
      }
    }

    return updated;
  }

  // Admin utility to cleanup files with missing Discord messages
  async cleanupOrphanedFiles(): Promise<{
    checked: number;
    orphaned: number;
    cleaned: number;
  }> {
    const files = await this.filesModel
      .find({
        isDeleted: false,
        messageId: { $exists: true, $ne: null },
        channelId: { $exists: true, $ne: null },
      })
      .exec();

    let checked = 0;
    let orphaned = 0;
    let cleaned = 0;

    for (const file of files) {
      checked++;

      try {
        const exists = await this.discordStorageService.messageExists(
          file.channelId,
          file.messageId,
        );

        if (!exists) {
          orphaned++;
          // Soft delete the file since Discord message is gone
          await this.filesModel.findByIdAndUpdate(file._id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletionReason: 'Discord message not found during cleanup',
          });
          cleaned++;
          console.log(`Cleaned orphaned file: ${file.name} (${file._id})`);
        }
      } catch (error) {
        console.error(`Error checking file ${file._id}:`, error);
      }
    }

    return { checked, orphaned, cleaned };
  }
}
