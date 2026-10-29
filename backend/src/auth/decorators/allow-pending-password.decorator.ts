import { SetMetadata } from '@nestjs/common';

// Permite el acceso aunque el usuario tenga pendiente cambiar su contraseña
export const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPassword';
export const AllowPendingPassword = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);
