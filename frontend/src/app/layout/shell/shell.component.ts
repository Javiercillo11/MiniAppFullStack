import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../auth/login/auth.service';
import { ROLE_LABELS } from '../../users/users.service';
import { ThemeMode, ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  theme = inject(ThemeService);
  themeOptions: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: 'light', icon: 'light_mode', label: 'Tema claro' },
    { mode: 'dark', icon: 'dark_mode', label: 'Tema oscuro' },
    { mode: 'system', icon: 'contrast', label: 'Tema del sistema' },
  ];

  user = this.authService.user;
  roleLabel = computed(() => {
    const user = this.user();
    return user ? ROLE_LABELS[user.role] : '';
  });
  initials = computed(() =>
    (this.user()?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('')
  );

  isMobile = toSignal(
    inject(BreakpointObserver).observe('(max-width: 959px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );

  logout() {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
