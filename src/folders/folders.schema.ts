import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FoldersDocument = HydratedDocument<Folders>;

@Schema({ timestamps: true })
export class Folders {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  // chilldren folders
  @Prop({ type: [Types.ObjectId], ref: 'Folders', default: [] })
  children: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Files', default: [] })
  files: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Folders', default: null })
  parent: Types.ObjectId | null;  
}

export const FoldersSchema = SchemaFactory.createForClass(Folders);
