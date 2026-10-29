import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  afterEach(() => localStorage.removeItem('theme'));

  it('aplica y recuerda el tema oscuro', () => {
    const service = TestBed.inject(ThemeService);
    service.setMode('dark');

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('en modo sistema no guarda preferencia', () => {
    const service = TestBed.inject(ThemeService);
    service.setMode('light');
    service.setMode('system');

    expect(localStorage.getItem('theme')).toBeNull();
    expect(service.mode()).toBe('system');
  });
});
