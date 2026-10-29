import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { User } from '../../users/schemas/user.schemas';
import { UserStatus } from '../../users/user-role.enum';
import { AuthUser, JwtPayload } from '../auth-user.interface';
import { ALLOW_PENDING_PASSWORD_KEY } from '../decorators/allow-pending-password.decorator';
import { ACCESS_COOKIE } from '../../config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o caducado');
    }

    // Se consulta la BBDD para que una desactivación, cambio de rol o cierre
    // de sesión tenga efecto inmediato, sin esperar a que caduque el token
    const user = await this.userModel
      .findById(payload.sub)
      .select('+tokenVersion')
      .exec();

    if (
      !user ||
      user.status !== UserStatus.Active ||
      user.tokenVersion !== payload.ver
    ) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_PASSWORD_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (user.mustChangePassword && !allowPending) {
      throw new ForbiddenException({
        message: 'Debes cambiar tu contraseña antes de continuar',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }

    request.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    return true;
  }

  // Cookie httpOnly (navegador) o cabecera Bearer (clientes de API)
  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    if (cookies?.[ACCESS_COOKIE]) {
      return cookies[ACCESS_COOKIE];
    }

    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
