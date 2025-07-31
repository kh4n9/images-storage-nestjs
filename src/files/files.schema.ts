import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FilesDocument = HydratedDocument<Files>;

@Schema({ timestamps: true })
export class Files {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Folders', default: null })
  folder: Types.ObjectId | null;

  @Prop({ default: 0 })
  size: number;

  @Prop({ default: '' })
  type: string;

  @Prop({ default: '' })
  mimeType: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ trim: true })
  deletionReason?: string;

  // Discord-specific fields
  @Prop({ required: true })
  discordMessageId: string;

  @Prop({ default: 'discord' })
  storageProvider: string;
}

export const FilesSchema = SchemaFactory.createForClass(Files);
