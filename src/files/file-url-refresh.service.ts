import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from './files.service';

@Injectable()
export class FileUrlRefreshService {
  private readonly logger = new Logger(FileUrlRefreshService.name);

  constructor(private readonly filesService: FilesService) {}

  // Provide an explicit name so the scheduler doesn't rely on a global `crypto`.
  // This prevents runtime errors in environments where the `crypto` global is absent.
  @Cron(CronExpression.EVERY_HOUR, { name: 'file-url-refresh' })
  async refreshUrls() {
    const updated = await this.filesService.refreshDiscordUrls();
    this.logger.log(`Refreshed URLs for ${updated} files`);
  }
}
