import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  create(dto: CreateUserDto) {
    if (!dto.phone) {
      throw new BadRequestException('Phone is required');
    }

    const phoneExists = this.users.some((u) => u.phone === dto.phone);
    if (phoneExists) {
      throw new ConflictException('Phone already exists');
    }

    const newUser: User = {
      id: this.idCounter++,
      ...dto,
    };

    this.users.push(newUser);
    return newUser;
  }

  update(id: number, dto: UpdateUserDto) {
    const user = this.findOne(id);

    if (dto.phone !== user.phone) {
      const phoneExists = this.users.some(
        (u) => u.phone === dto.phone && u.id !== id,
      );
      if (phoneExists) {
        throw new ConflictException('Phone already exists');
      }
    }

    Object.assign(user, dto);
    return user;
  }

  remove(id: number) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException('User not found');
    }

    this.users.splice(index, 1);
    return { ok: true };
  }
}
