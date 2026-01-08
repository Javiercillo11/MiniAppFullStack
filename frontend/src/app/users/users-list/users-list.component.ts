import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, User } from '../users.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/login/auth.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  users: User[] = [];

  constructor(private usersService: UsersService, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getAll().subscribe({
      next: res => (this.users = res),
      error: err => alert('Error cargando usuarios'),
    });
  }

  createUser() {
    this.router.navigate(['/users/create']);
  }

  editUser(user: User) {
    this.router.navigate(['/users/edit', user.id]);
  }

  deleteUser(user: User) {
    if (confirm(`¿Eliminar usuario ${user.name}?`)) {
      this.usersService.delete(user.id).subscribe({
        next: () => this.loadUsers(),
        error: err => alert('Error eliminando usuario'),
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
