import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private media = window.matchMedia('(prefers-color-scheme: dark)');

  readonly mode = signal<ThemeMode>(this.readMode());

  constructor() {
    this.media.addEventListener('change', () => this.apply());
    this.apply();
  }

  setMode(mode: ThemeMode) {
    this.mode.set(mode);
    try {
      if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Sin almacenamiento disponible: el tema se aplica solo en esta sesión
    }
    this.apply();
  }

  private apply() {
    const mode = this.mode();
    const dark = mode === 'dark' || (mode === 'system' && this.media.matches);
    document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  }

  private readMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
