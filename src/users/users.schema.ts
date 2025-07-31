import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email',
    },
  })
  email: string;

  @Prop({
    required: true,
    minlength: 6, // Độ dài tối thiểu cho password hash
  })
  password: string;

  @Prop({
    type: [String],
    default: [Role.User],
    enum: Object.values(Role), // Validate roles phải thuộc enum
  })
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
