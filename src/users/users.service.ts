import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schema';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(user: User) {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findAll() {
    return this.userModel.find().exec();
  }

  async findOne(email: string) {
    return this.userModel.findOne({ email });
  }

  async update(id: string, user: Partial<User>) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.userModel.findByIdAndUpdate(id, user, {
      new: true,
      runValidators: true,
    });
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.userModel.findByIdAndDelete(id);
  }
}
