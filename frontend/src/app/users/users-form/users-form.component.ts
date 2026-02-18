import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsersService, User } from '../users.service';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './users-form.component.html',
  styleUrl: './users-form.component.scss'
})
export class UsersFormComponent implements OnInit {

  user: Partial<User> = {};
  isEdit = false;
  userId?: string;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') ?? undefined;

    if (this.userId) {
      this.isEdit = true;

      this.usersService.getOne(this.userId).subscribe({
        next: res => this.user = res,
        error: () =>
          this.snackBar.open('Usuario no encontrado', 'Cerrar', { duration: 3000 })
      });
    }
  }

  save() {
    const request = this.isEdit
      ? this.usersService.update(this.userId!, this.user)
      : this.usersService.create(this.user);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Usuario actualizado' : 'Usuario creado',
          'OK',
          { duration: 2000 }
        );
        this.router.navigate(['/users']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.snackBar.open('Teléfono ya existe', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error guardando usuario', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
