import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/schemas/user.schemas';
import { UserStatus } from '../users/user-role.enum';
import { JwtPayload, RefreshPayload } from './auth-user.interface';
import { config } from '../config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password +tokenVersion')
      .exec();

    const valid = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !valid) {
      throw new UnauthorizedException({
        ok: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status !== UserStatus.Active) {
      throw new ForbiddenException({
        ok: false,
        message: 'Usuario desactivado',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return { user: user.toJSON(), tokens: await this.issueTokens(user) };
  }

  async refresh(refreshToken: string | undefined) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(
        refreshToken ?? '',
        { secret: config.jwtRefreshSecret },
      );
    } catch {
      throw new UnauthorizedException('Sesión caducada');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+tokenVersion')
      .exec();

    if (
      !user ||
      user.status !== UserStatus.Active ||
      user.tokenVersion !== payload.ver
    ) {
      throw new UnauthorizedException('Sesión caducada');
    }

    return { user: user.toJSON(), tokens: await this.issueTokens(user) };
  }

  // Invalida todos los tokens del usuario (en todos los dispositivos)
  async logout(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $inc: { tokenVersion: 1 } },
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('+password +tokenVersion')
      .exec();

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta de la actual',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    // Cierra el resto de sesiones abiertas
    user.tokenVersion += 1;
    await user.save();

    return { user: user.toJSON(), tokens: await this.issueTokens(user) };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const access: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      ver: user.tokenVersion,
    };
    const refresh: RefreshPayload = {
      sub: String(user._id),
      ver: user.tokenVersion,
    };

    return {
      accessToken: await this.jwtService.signAsync(access, {
        expiresIn: config.accessTokenTtlSeconds,
      }),
      refreshToken: await this.jwtService.signAsync(refresh, {
        secret: config.jwtRefreshSecret,
        expiresIn: config.refreshTokenTtlSeconds,
      }),
    };
  }
}
