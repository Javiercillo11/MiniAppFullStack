import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsersService, User, Role, UserPayload, ROLE_LABELS } from '../users.service';
import { AuthService } from '../../auth/login/auth.service';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './users-form.component.html',
  styleUrl: './users-form.component.scss'
})
export class UsersFormComponent implements OnInit {

  private auth = inject(AuthService);

  user: Partial<User> = { role: 'viewer', status: 'active' };
  password = '';
  hidePassword = true;
  isEdit = false;
  loading = false;
  saving = false;
  userId?: string;

  roleLabels = ROLE_LABELS;
  roleHelp: Record<Role, string> = {
    admin: 'Acceso total: gestiona usuarios, roles y estados.',
    editor: 'Puede crear y editar usuarios que no sean administradores.',
    viewer: 'Solo puede consultar el listado de usuarios.',
  };

  // Un editor no puede asignar el rol de administrador
  get availableRoles(): Role[] {
    return this.auth.isAdmin() || this.user.role === 'admin'
      ? ['admin', 'editor', 'viewer']
      : ['editor', 'viewer'];
  }

  get isSelf() {
    return this.isEdit && this.userId === this.auth.user()?.id;
  }

  get canChangeStatus() {
    return this.auth.isAdmin() && !this.isSelf;
  }

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
      this.loading = true;

      this.usersService.getOne(this.userId).subscribe({
        next: res => {
          this.user = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Usuario no encontrado', 'Cerrar', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    }
  }

  save(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.saving = true;

    const payload: UserPayload = {
      name: this.user.name!,
      email: this.user.email!,
      phone: this.user.phone!,
    };
    if (this.password) payload.password = this.password;
    if (!this.isSelf) payload.role = this.user.role;
    if (this.canChangeStatus) payload.status = this.user.status;

    const request = this.isEdit
      ? this.usersService.update(this.userId!, payload)
      : this.usersService.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Usuario actualizado' : 'Usuario creado',
          'OK',
          { duration: 2000, panelClass: 'snack-success' }
        );
        this.router.navigate(['/users']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        const message = typeof err.error?.message === 'string'
          ? err.error.message
          : 'Error guardando usuario';
        this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
