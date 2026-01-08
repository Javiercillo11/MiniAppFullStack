import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    const result = this.authService.login(dto.username, dto.password);

    if (!result.ok) {
      throw new UnauthorizedException({
        ok: false,
        message: 'Invalid credentials',
      });
    }

    return result;
  }
}
