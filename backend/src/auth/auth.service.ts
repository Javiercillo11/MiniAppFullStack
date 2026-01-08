import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly USERNAME = 'admin';
  private readonly PASSWORD = 'admin123';
  private readonly TOKEN = 'fake-token';

  login(username: string, password: string) {
    if (username === this.USERNAME && password === this.PASSWORD) {
      return {
        ok: true,
        token: this.TOKEN,
      };
    }

    return {
      ok: false,
    };
  }
}
