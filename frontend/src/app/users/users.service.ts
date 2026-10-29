import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Role = 'admin' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Lector',
};

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export type UserPayload = Pick<User, 'name' | 'email' | 'phone'> &
  Partial<Pick<User, 'role' | 'status'>> & { password?: string };

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = '/api/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  getOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  create(user: UserPayload): Observable<User> {
    return this.http.post<User>(this.api, user);
  }

  update(id: string, user: UserPayload): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, user);
  }

  setStatus(id: string, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`${this.api}/${id}/status`, { status });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
