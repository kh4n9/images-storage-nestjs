import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { Files, FilesSchema } from './files.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscordStorageService } from '../common/services/discord-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Files.name, schema: FilesSchema }]),
  ],
  controllers: [FilesController],
  providers: [FilesService, DiscordStorageService],
  exports: [FilesService, DiscordStorageService],
})
export class FilesModule {}
