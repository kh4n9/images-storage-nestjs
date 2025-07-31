import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { FoldersSchema } from './folders.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Folders',
        schema: FoldersSchema, // Assuming FoldersSchema is defined in folders.schema.ts
      },
    ]),
    FilesModule,
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
