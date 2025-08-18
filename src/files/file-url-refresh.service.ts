import { Injectable, Logger } from '@nestjs/common';
import { FilesService } from './files.service';

@Injectable()
export class FileUrlRefreshService {
  private readonly logger = new Logger(FileUrlRefreshService.name);

  constructor(private readonly filesService: FilesService) {}

  async refreshUrlsForUser(userId: string) {
    const updated = await this.filesService.refreshDiscordUrlsForUser(userId);
    this.logger.log(
      `Refreshed URLs for ${updated} files of user ${userId}`,
    );
  }
}
