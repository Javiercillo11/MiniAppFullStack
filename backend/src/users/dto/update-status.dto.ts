import { IsEnum } from 'class-validator';
import { UserStatus } from '../user-role.enum';

export class UpdateStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
