import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AllowPendingPassword } from './decorators/allow-pending-password.decorator';
import type { AuthUser } from './auth-user.interface';
import { ACCESS_COOKIE, REFRESH_COOKIE, config } from '../config';

const LOGIN_THROTTLE = {
  default: { limit: config.loginRateLimit, ttl: 60_000 },
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(LOGIN_THROTTLE)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(
      dto.email,
      dto.password,
    );
    this.setCookies(res, tokens);
    return { ok: true, user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const { user, tokens } = await this.authService.refresh(
      cookies?.[REFRESH_COOKIE],
    );
    this.setCookies(res, tokens);
    return { ok: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @AllowPendingPassword()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    this.clearCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @AllowPendingPassword()
  @Throttle(LOGIN_THROTTLE)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() current: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.changePassword(
      current.id,
      dto.currentPassword,
      dto.newPassword,
    );
    this.setCookies(res, tokens);
    return { ok: true, user };
  }

  @UseGuards(JwtAuthGuard)
  @AllowPendingPassword()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  private cookieOptions(maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setCookies(res: Response, tokens: AuthTokens) {
    res.cookie(
      ACCESS_COOKIE,
      tokens.accessToken,
      this.cookieOptions(config.accessTokenTtlSeconds),
    );
    res.cookie(
      REFRESH_COOKIE,
      tokens.refreshToken,
      this.cookieOptions(config.refreshTokenTtlSeconds),
    );
  }

  private clearCookies(res: Response) {
    const options: CookieOptions = {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'strict',
      path: '/',
    };
    res.clearCookie(ACCESS_COOKIE, options);
    res.clearCookie(REFRESH_COOKIE, options);
  }
}
