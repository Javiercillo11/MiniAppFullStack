import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username es obligatorio' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password es obligatorio' })
  password: string;
}
