import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  getOne(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  create(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.api, user);
  }

  update(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, user);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
