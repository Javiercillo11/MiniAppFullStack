import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schemas';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, UserStatus } from './user-role.enum';
import { AuthUser } from '../auth/auth-user.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  // Crea un administrador inicial si no existe ninguno
  async onApplicationBootstrap() {
    const hasAdmin = await this.userModel.exists({ role: Role.Admin });
    if (hasAdmin) return;

    const email = process.env.ADMIN_EMAIL ?? 'admin@miniapp.local';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';

    try {
      await this.userModel.create({
        name: 'Administrador',
        email,
        phone: process.env.ADMIN_PHONE ?? '000000000',
        password: await bcrypt.hash(password, SALT_ROUNDS),
        role: Role.Admin,
        status: UserStatus.Active,
        mustChangePassword: true,
      });
    } catch (err) {
      // Otra instancia lo creó a la vez (clave duplicada)
      if ((err as { code?: number }).code === 11000) return;
      throw err;
    }

    this.logger.log(`Administrador inicial creado: ${email}`);
  }

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    if (actor.role !== Role.Admin) {
      if (dto.role === Role.Admin) {
        throw new ForbiddenException(
          'Solo un administrador puede crear administradores',
        );
      }
      if (dto.status) {
        throw new ForbiddenException(
          'Solo un administrador puede cambiar el estado',
        );
      }
    }

    await this.ensureUnique(dto.email, dto.phone);

    // La contraseña la fija otra persona: el usuario deberá cambiarla al entrar
    const newUser = await this.userModel.create({
      ...dto,
      password: await bcrypt.hash(dto.password, SALT_ROUNDS),
      mustChangePassword: true,
    });
    return newUser;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.findOne(id);
    const isSelf = String(user._id) === actor.id;
    const roleChanges = dto.role !== undefined && dto.role !== user.role;
    const statusChanges =
      dto.status !== undefined && dto.status !== user.status;

    if (actor.role !== Role.Admin) {
      if (user.role === Role.Admin || dto.role === Role.Admin) {
        throw new ForbiddenException(
          'Solo un administrador puede gestionar administradores',
        );
      }
      if (statusChanges) {
        throw new ForbiddenException(
          'Solo un administrador puede cambiar el estado',
        );
      }
    }

    if (isSelf && (roleChanges || statusChanges)) {
      throw new ForbiddenException('No puedes cambiar tu propio rol o estado');
    }

    if (
      user.role === Role.Admin &&
      ((roleChanges && dto.role !== Role.Admin) ||
        (statusChanges && dto.status !== UserStatus.Active))
    ) {
      await this.ensureAnotherActiveAdmin(id);
    }

    await this.ensureUnique(dto.email, dto.phone, id);

    const { password, ...data } = dto;
    Object.assign(user, data);
    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
      // Restablecida por otra persona: obligar a cambiarla y cerrar sus sesiones
      if (!isSelf) {
        user.mustChangePassword = true;
      }
    }

    const saved = await user.save();

    if (password && !isSelf) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $inc: { tokenVersion: 1 } },
      );
    }

    return saved;
  }

  async setStatus(id: string, status: UserStatus, actor: AuthUser) {
    const user = await this.findOne(id);

    if (String(user._id) === actor.id) {
      throw new ForbiddenException('No puedes cambiar tu propio estado');
    }

    if (user.role === Role.Admin && status !== UserStatus.Active) {
      await this.ensureAnotherActiveAdmin(id);
    }

    user.status = status;
    return user.save();
  }

  async remove(id: string, actor: AuthUser) {
    const user = await this.findOne(id);

    if (String(user._id) === actor.id) {
      throw new ForbiddenException('No puedes eliminar tu propio usuario');
    }

    if (user.role === Role.Admin) {
      await this.ensureAnotherActiveAdmin(id);
    }

    await user.deleteOne();
    return { ok: true };
  }

  private async ensureUnique(email: string, phone: string, excludeId?: string) {
    const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};

    if (
      await this.userModel.exists({
        email: email.toLowerCase().trim(),
        ...notSelf,
      })
    ) {
      throw new ConflictException('Email ya existe');
    }

    if (await this.userModel.exists({ phone, ...notSelf })) {
      throw new ConflictException('Teléfono ya existe');
    }
  }

  // Evita quedarse sin ningún administrador activo
  private async ensureAnotherActiveAdmin(excludeId: string) {
    const others = await this.userModel.countDocuments({
      _id: { $ne: excludeId },
      role: Role.Admin,
      status: UserStatus.Active,
    });

    if (others === 0) {
      throw new BadRequestException(
        'Debe quedar al menos un administrador activo',
      );
    }
  }
}
