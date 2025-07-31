import { Types } from 'mongoose';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsOptional()
  readonly userId?: Types.ObjectId;

  @IsOptional()
  @IsArray()
  readonly children?: Types.ObjectId[];

  @IsOptional()
  @IsArray()
  readonly files?: Types.ObjectId[];

  @IsOptional()
  readonly parent?: Types.ObjectId | null;
}
