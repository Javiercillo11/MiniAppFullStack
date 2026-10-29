import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password es obligatorio' })
  password: string;
}
