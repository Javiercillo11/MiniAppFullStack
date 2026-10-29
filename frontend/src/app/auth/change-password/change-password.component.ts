import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Cambio obligatorio (primer acceso o contraseña restablecida por otro)
  forced = !!this.authService.user()?.mustChangePassword;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  hide = true;
  saving = false;
  error = '';

  checkMatch(confirm: NgModel) {
    const mismatch = !!this.confirmPassword && this.confirmPassword !== this.newPassword;
    const errors = { ...(confirm.control.errors ?? {}) };
    delete errors['mismatch'];
    if (mismatch) errors['mismatch'] = true;
    confirm.control.setErrors(Object.keys(errors).length ? errors : null);
  }

  save(form: NgForm, confirm: NgModel) {
    this.checkMatch(confirm);
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate(['/users']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = err.status === 429
          ? 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.'
          : typeof err.error?.message === 'string' ? err.error.message : 'No se ha podido cambiar la contraseña';
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
