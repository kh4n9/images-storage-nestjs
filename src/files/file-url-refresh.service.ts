import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from './files.service';

@Injectable()
export class FileUrlRefreshService {
  private readonly logger = new Logger(FileUrlRefreshService.name);

  constructor(private readonly filesService: FilesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refreshUrls() {
    const updated = await this.filesService.refreshDiscordUrls();
    this.logger.log(`Refreshed URLs for ${updated} files`);
  }
}
