import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schemas';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    if (!dto.phone) {
      throw new BadRequestException('Phone is required');
    }

    const phoneExists = await this.userModel.exists({
      phone: dto.phone,
    });

    if (phoneExists) {
      throw new ConflictException('Phone already exists');
    }

    const newUser = await this.userModel.create(dto);
    return newUser;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.userModel.exists({
        phone: dto.phone,
        _id: { $ne: id },
      });

      if (phoneExists) {
        throw new ConflictException('Phone already exists');
      }
    }

    Object.assign(user, dto);
    return user.save();
  }

  async remove(id: string) {
    const result = await this.userModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return { ok: true };
  }
}
