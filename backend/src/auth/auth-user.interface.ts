import { Role } from '../users/user-role.enum';

// Payload firmado en el token de acceso
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  ver: number;
}

// Payload del token de refresco
export interface RefreshPayload {
  sub: string;
  ver: number;
}

// Usuario autenticado que los guards adjuntan a la request
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
}
