import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { UsersService, User, UserStatus, ROLE_LABELS } from '../users.service';
import { AuthService } from '../../auth/login/auth.service';

const AVATAR_COLORS = ['#1f5fbf', '#0f766e', '#7c3aed', '#b45309', '#be185d', '#0369a1', '#4d7c0f'];

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatButtonToggleModule
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {

  auth = inject(AuthService);

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status', 'actions'];
  roleLabels = ROLE_LABELS;
  loading = false;

  search = '';
  statusFilter: 'all' | UserStatus = 'all';

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  selectedUser!: User;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.filterPredicate = user => {
      const text = `${user.name} ${user.email} ${user.phone}`.toLowerCase();
      return (this.statusFilter === 'all' || user.status === this.statusFilter)
        && text.includes(this.search);
    };
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.usersService.getAll().subscribe({
      next: res => {
        this.dataSource.data = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  get isFiltering() {
    return !!this.search || this.statusFilter !== 'all';
  }

  setSearch(event: Event) {
    this.search = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.refreshFilter();
  }

  setStatusFilter(status: 'all' | UserStatus) {
    this.statusFilter = status;
    this.refreshFilter();
  }

  // El predicado lee el estado del componente; basta con cambiar el valor para relanzarlo
  private refreshFilter() {
    this.dataSource.filter = `${this.search}|${this.statusFilter}`;
  }

  roleLabel(user: User) {
    return this.roleLabels[user.role];
  }

  isSelf(user: User) {
    return user._id === this.auth.user()?.id;
  }

  // Mismas reglas que aplica el backend
  canEdit(user: User) {
    return this.auth.isAdmin() || (this.auth.canManage() && user.role !== 'admin');
  }

  canAdminister(user: User) {
    return this.auth.isAdmin() && !this.isSelf(user);
  }

  initials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  avatarColor(name: string): string {
    const hash = [...(name ?? '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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
      width: '420px',
      maxWidth: 'calc(100vw - 32px)'
    });
  }

  toggleStatus(user: User, status: UserStatus = user.status === 'active' ? 'inactive' : 'active') {
    this.usersService.setStatus(user._id, status).subscribe({
      next: updated => {
        user.status = updated.status;
        this.refreshFilter();

        this.snackBar
          .open(status === 'active' ? 'Usuario activado' : 'Usuario desactivado', 'Deshacer', {
            duration: 4000,
            panelClass: 'snack-success'
          })
          .onAction()
          .subscribe(() => this.toggleStatus(user, status === 'active' ? 'inactive' : 'active'));
      },
      error: (err: HttpErrorResponse) => this.showError(err, 'Error cambiando el estado')
    });
  }

  confirmDelete() {
    this.usersService.delete(this.selectedUser._id).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado', 'OK', { duration: 2000, panelClass: 'snack-success' });
        this.loadUsers();
        this.dialog.closeAll();
      },
      error: (err: HttpErrorResponse) => this.showError(err, 'Error eliminando usuario')
    });
  }

  private showError(err: HttpErrorResponse, fallback: string) {
    const message = typeof err.error?.message === 'string' ? err.error.message : fallback;
    this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
  }
}
