import { Injectable } from '@nestjs/common';
import { Folders, FoldersDocument } from './folders.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FilesService } from '../files/files.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectModel(Folders.name) private foldersModel: Model<FoldersDocument>,
    private filesService: FilesService,
  ) {}

  async createFolder(folderData: Partial<Folders>): Promise<Folders> {
    const newFolder = new this.foldersModel(folderData);
    const savedFolder = await newFolder.save();
    // Nếu có parent, cập nhật children cho folder cha
    if (savedFolder.parent) {
      await this.foldersModel.findByIdAndUpdate(savedFolder.parent, {
        $push: { children: savedFolder._id },
      });
    }
    return savedFolder;
  }

  async getFoldersByUserId(userId: string): Promise<Folders[]> {
    return this.foldersModel.find({ userId }).exec();
  }

  async getFolderById(folderId: string): Promise<Folders | null> {
    if (!folderId || folderId === 'undefined' || folderId === 'null') {
      return null;
    }
    return this.foldersModel.findById(folderId).exec();
  }

  async getChildrenFolders(folderId: string): Promise<Folders[]> {
    if (!folderId || folderId === 'undefined' || folderId === 'null') {
      return [];
    }
    return this.foldersModel.find({ parent: folderId }).exec();
  }

  async getChildrenFoldersWithFileCount(folderId: string): Promise<any[]> {
    if (!folderId || folderId === 'undefined' || folderId === 'null') {
      return [];
    }
    console.log('Getting children folders for parent:', folderId);
    const folders = await this.foldersModel.find({ parent: folderId }).exec();
    console.log(
      'Found children folders:',
      folders.map((f) => ({ name: f.name, id: f._id, parent: f.parent })),
    );

    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const fileCount = await this.filesService.countFilesInFolder(
          folder._id.toString(),
        );
        return {
          ...folder.toObject(),
          fileCount,
        };
      }),
    );
    return foldersWithCount;
  }

  async updateFolder(
    folderId: string,
    updateData: Partial<Folders>,
  ): Promise<Folders | null> {
    // Validate folderId
    if (!folderId || folderId === 'undefined' || folderId === 'null') {
      throw new Error('Invalid folder ID');
    }

    // Lấy folder hiện tại để kiểm tra parent cũ
    const currentFolder = await this.foldersModel.findById(folderId);
    const oldParent = currentFolder?.parent?.toString();
    const newParent = updateData.parent?.toString();
    // Nếu parent thay đổi
    if (oldParent && oldParent !== newParent) {
      // Xóa khỏi children của cha cũ
      await this.foldersModel.findByIdAndUpdate(oldParent, {
        $pull: { children: folderId },
      });
    }
    if (newParent && oldParent !== newParent) {
      // Thêm vào children của cha mới
      await this.foldersModel.findByIdAndUpdate(newParent, {
        $addToSet: { children: folderId },
      });
    }
    return this.foldersModel
      .findByIdAndUpdate(folderId, updateData, { new: true })
      .exec();
  }

  async deleteFolder(folderId: string): Promise<Folders | null> {
    // Validate folderId
    if (!folderId || folderId === 'undefined' || folderId === 'null') {
      throw new Error('Invalid folder ID');
    }

    const childrenFolders = await this.getChildrenFolders(folderId);
    if (childrenFolders.length > 0) {
      throw new Error('Cannot delete folder with children folders');
    }
    // Lấy folder để kiểm tra parent
    const folder = await this.foldersModel.findById(folderId);
    if (folder?.parent) {
      await this.foldersModel.findByIdAndUpdate(folder.parent, {
        $pull: { children: folderId },
      });
    }
    return this.foldersModel.findByIdAndDelete(folderId).exec();
  }

  async getAllFolders(): Promise<Folders[]> {
    return this.foldersModel.find().exec();
  }

  async getUserRootFolders(userId: string): Promise<Folders[]> {
    return this.foldersModel.find({ userId, parent: null }).exec();
  }

  async getFoldersWithFileCount(userId: string): Promise<any[]> {
    const folders = await this.foldersModel.find({ userId }).exec();
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const fileCount = await this.filesService.countFilesInFolder(
          folder._id.toString(),
        );
        return {
          ...folder.toObject(),
          fileCount,
        };
      }),
    );
    return foldersWithCount;
  }

  async getUserRootFoldersWithFileCount(userId: string): Promise<any[]> {
    console.log('Getting root folders for user:', userId);
    const folders = await this.foldersModel
      .find({ userId, parent: null })
      .exec();
    console.log(
      'Found root folders:',
      folders.map((f) => ({ name: f.name, id: f._id, parent: f.parent })),
    );

    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const fileCount = await this.filesService.countFilesInFolder(
          folder._id.toString(),
        );
        return {
          ...folder.toObject(),
          fileCount,
        };
      }),
    );
    return foldersWithCount;
  }
}
