import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsMongoId()
  folderId?: Types.ObjectId;

  @IsOptional()
  @IsString()
  description?: string;
}
