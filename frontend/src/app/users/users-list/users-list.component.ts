import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TemplateRef, ViewChild } from '@angular/core';

import { UsersService, User } from '../users.service';
import { AuthService } from '../../auth/login/auth.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {

  users: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'actions'];

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  selectedUser!: User;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getAll().subscribe({
      next: res => this.users = res,
      error: () =>
        this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000 })
    });
  }

  createUser() {
    this.router.navigate(['/users/create']);
  }

  editUser(user: User) {
    this.router.navigate(['/users/edit', user._id]);
  }

  deleteUser(user: User) {
    this.selectedUser = user;

    this.dialog.open(this.confirmDialog, {
      width: '350px'
    });
  }

  confirmDelete() {
    this.usersService.delete(this.selectedUser._id).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado', 'OK', { duration: 2000 });
        this.loadUsers();
        this.dialog.closeAll();
      },
      error: () =>
        this.snackBar.open('Error eliminando usuario', 'Cerrar', { duration: 3000 })
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
