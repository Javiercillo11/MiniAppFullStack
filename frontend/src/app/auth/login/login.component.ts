import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email = '';
  password = '';
  hide = true;
  loading = false;
  error = '';
  year = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate([this.authService.user()?.mustChangePassword ? '/change-password' : '/users']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error =
          err.status === 403 ? 'Tu usuario está desactivado. Contacta con un administrador.'
          : err.status === 429 ? 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.'
          : err.status === 401 ? 'Credenciales incorrectas'
          : 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
      }
    });
  }
}
