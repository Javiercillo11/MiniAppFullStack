import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    const result = this.authService.login(body.username, body.password);

    if (!result.ok) {
      throw new UnauthorizedException({
        ok: false,
        message: 'Invalid credentials',
      });
    }

    return result;
  }
}
