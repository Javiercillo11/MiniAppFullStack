import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <main class="not-found">
      <span class="code">404</span>
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o se ha movido.</p>
      <a mat-flat-button routerLink="/users">
        <mat-icon>arrow_back</mat-icon>
        Volver al inicio
      </a>
    </main>
  `,
  styles: `
    .not-found {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }

    .code {
      font-size: 5rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--app-primary);
    }

    h1 { font-size: 1.5rem; font-weight: 700; }

    p {
      margin: 0 0 12px;
      color: var(--app-text-muted);
    }
  `
})
export class NotFoundComponent {}
