import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService, User } from '../users.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-form.component.html',
})
export class UsersFormComponent implements OnInit {
  user: Partial<User> = {};
  error = '';
  isEdit = false;
  userId?: number;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.userId = Number(this.route.snapshot.params['id']);
    if (this.userId) {
      this.isEdit = true;
      this.usersService.getOne(this.userId).subscribe({
        next: res => (this.user = res),
        error: err => alert('Usuario no encontrado'),
      });
    }
  }

  save() {
    this.error = '';
    const obs = this.isEdit
      ? this.usersService.update(this.userId!, this.user)
      : this.usersService.create(this.user);

    obs.subscribe({
      next: () => this.router.navigate(['/users']),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) this.error = 'Teléfono ya existe';
        else this.error = 'Error guardando usuario';
      },
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
